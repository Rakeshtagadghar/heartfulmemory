import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { convexMutation, convexQuery, anyApi, getConvexUrl } from "../../../../lib/convex/ops";
import { computeExportHash } from "../../../../lib/export/exportHash";
import { signR2GetObject } from "../../../../lib/r2/server";
import { buildExportPdfKey, putExportPdfToR2 } from "../../../../lib/r2/putExportPdf";
import { getR2FreeTierCaps } from "../../../../lib/uploads/r2Quota";
import { normalizeStorybookExportSettingsV1 } from "../../../../../../packages/shared-schema/storybookSettings.types";
import type { ExportTarget, PdfRenderContract, PdfRenderOutputMeta } from "../../../../../../packages/pdf-renderer/src/contracts";
import { renderWithPlaywright } from "../../../../../../packages/pdf-renderer/src/renderWithPlaywright";
import {
  type ExportValidationIssue,
  validateExportContract
} from "../../../../../../packages/rules-engine/src";

export const runtime = "nodejs";

const exportCache = new Map<string, { pdf: Buffer; meta: PdfRenderOutputMeta; createdAt: number; fileKey?: string }>();

type ExportPreflightResult = {
  ok: boolean;
  issues: ExportValidationIssue[];
  blockingIssues: ExportValidationIssue[];
  warnings: ExportValidationIssue[];
};

type ExportPayload = {
  storybook: {
    id: string;
    title: string;
    subtitle: string | null;
    updated_at: string;
    settings: Record<string, unknown>;
  };
  pages: Array<{
    id: string;
    storybook_id: string;
    order_index: number;
    size_preset: "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11";
    width_px: number;
    height_px: number;
    margins: { top: number; right: number; bottom: number; left: number; unit: "px" };
    grid: { enabled: boolean; columns: number; gutter: number; rowHeight: number; showGuides: boolean };
    background: { fill: string };
    updated_at: string;
  }>;
  frames: Array<{
    id: string;
    storybook_id: string;
    page_id: string;
    type: "TEXT" | "IMAGE";
    x: number;
    y: number;
    w: number;
    h: number;
    z_index: number;
    locked: boolean;
    style: Record<string, unknown>;
    content: Record<string, unknown>;
    crop: Record<string, unknown> | null;
    version: number;
    updated_at: string;
  }>;
  assets: Array<{
    id: string;
    source?: string | null;
    sourceUrl?: string | null;
    storageProvider?: string | null;
    storageKey?: string | null;
    width?: number | null;
    height?: number | null;
    mimeType?: string | null;
    license?: Record<string, unknown> | null;
  }>;
};

function toContract(payload: ExportPayload, exportTarget: ExportTarget): PdfRenderContract {
  const firstPage = payload.pages.slice().sort((a, b) => a.order_index - b.order_index)[0];
  const normalizedSettings = normalizeStorybookExportSettingsV1(
    payload.storybook.settings ?? {},
    firstPage?.size_preset,
    firstPage?.margins
  );
  return {
    exportTarget,
    storybook: {
      id: payload.storybook.id,
      title: payload.storybook.title,
      subtitle: payload.storybook.subtitle,
      updatedAt: payload.storybook.updated_at,
      settings: {
        ...payload.storybook.settings,
        ...normalizedSettings
      }
    },
    pages: payload.pages.map((page) => ({
      id: page.id,
      orderIndex: page.order_index,
      sizePreset: page.size_preset,
      widthPx: page.width_px,
      heightPx: page.height_px,
      margins: page.margins,
      grid: page.grid,
      background: page.background
    })),
    frames: payload.frames.map((frame) => ({
      id: frame.id,
      pageId: frame.page_id,
      type: frame.type,
      x: frame.x,
      y: frame.y,
      w: frame.w,
      h: frame.h,
      zIndex: frame.z_index,
      locked: frame.locked,
      style: frame.style ?? {},
      content: frame.content ?? {},
      crop: frame.crop ?? null,
      version: frame.version
    })),
    assets: payload.assets.map((asset) => ({
      id: asset.id,
      source: asset.source ?? null,
      sourceUrl: asset.sourceUrl ?? null,
      storageProvider: asset.storageProvider ?? null,
      storageKey: asset.storageKey ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
      mimeType: asset.mimeType ?? null,
      license: asset.license ?? null
    }))
  };
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function shouldStoreExportPdfsInR2() {
  const value = (process.env.EXPORT_PDF_STORE_R2 ?? "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function toSafeFilenameBase(title: string) {
  return title.replaceAll(/[^a-z0-9-_]+/gi, "_");
}

function missingLicenseForReferencedStockAssets(payload: ExportPayload) {
  const usedAssetIds = new Set(
    payload.frames
      .filter((frame) => frame.type === "IMAGE")
      .map((frame) => (typeof frame.content.assetId === "string" ? frame.content.assetId : null))
      .filter((id): id is string => Boolean(id))
  );

  const missing = payload.assets.filter((asset) => {
    if (!usedAssetIds.has(asset.id)) return false;
    const source = typeof asset.source === "string" ? asset.source : null;
    if (!source || source === "UPLOAD") return false;
    return !asset.license || typeof asset.license !== "object";
  });
  return missing;
}

function buildPreflightResult(payload: ExportPayload, exportTarget: ExportTarget): ExportPreflightResult {
  const contract = toContract(payload, exportTarget);
  const rules = validateExportContract(contract);
  const issues = [...rules.issues];

  const missingLicenseAssets = missingLicenseForReferencedStockAssets(payload);
  for (const asset of missingLicenseAssets) {
    const referencedFrame = payload.frames.find(
      (frame) => frame.type === "IMAGE" && frame.content.assetId === asset.id
    );
    issues.push({
      code: "LICENSE_MISSING",
      target: exportTarget,
      severity: "error",
      blocking: true,
      pageId: referencedFrame?.page_id ?? payload.pages[0]?.id ?? "unknown",
      frameId: referencedFrame?.id,
      path: {
        pageId: referencedFrame?.page_id ?? payload.pages[0]?.id ?? "unknown",
        frameId: referencedFrame?.id
      },
      message: "Stock image license metadata is missing; export is blocked until metadata is present."
    });
  }

  const blockingIssues = issues.filter((issue) => issue.blocking);
  const warnings = issues.filter((issue) => !issue.blocking);
  return {
    ok: blockingIssues.length === 0,
    issues,
    blockingIssues,
    warnings
  };
}

async function recordExportAttemptSafe(input: {
  viewerSubject: string;
  storybookId: string;
  exportTarget: ExportTarget;
  exportHash: string;
  status: "SUCCESS" | "FAILED";
  pageCount: number;
  warningsCount: number;
  runtimeMs?: number;
  fileKey?: string;
  fileUrl?: string;
  errorSummary?: string;
}) {
  await convexMutation<{ id: string }>(anyApi.exports.recordExportAttempt, {
    viewerSubject: input.viewerSubject,
    storybookId: input.storybookId,
    exportTarget: input.exportTarget,
    exportHash: input.exportHash,
    status: input.status,
    pageCount: input.pageCount,
    warningsCount: input.warningsCount,
    runtimeMs: input.runtimeMs,
    fileKey: input.fileKey,
    fileUrl: input.fileUrl,
    errorSummary: input.errorSummary
  });
}

type ExportLookupRecord = {
  id: string;
  storybookId: string;
  exportTarget: ExportTarget;
  exportHash: string;
  status: "SUCCESS" | "FAILED";
  fileKey: string | null;
  fileUrl: string | null;
  createdAt: string;
};

export async function GET(request: Request) {
  if (!getConvexUrl()) {
    return jsonError(500, "Convex is not configured.");
  }
  const url = new URL(request.url);
  const storybookId = url.searchParams.get("storybookId") ?? "";
  const exportTarget = url.searchParams.get("exportTarget");
  const exportHash = url.searchParams.get("exportHash") ?? "";
  if (!storybookId || !exportHash) {
    return jsonError(400, "storybookId and exportHash are required.");
  }
  if (exportTarget !== "DIGITAL_PDF" && exportTarget !== "HARDCOPY_PRINT_PDF") {
    return jsonError(400, "Invalid exportTarget.");
  }

  const user = await requireAuthenticatedUser(`/app/storybooks/${storybookId}/layout`);
  const lookup = await convexQuery<ExportLookupRecord>(anyApi.exports.getExportByHash, {
    viewerSubject: user.id,
    storybookId,
    exportTarget,
    exportHash
  });
  if (!lookup.ok) {
    return jsonError(404, "Export record not found.");
  }
  if (lookup.data.status !== "SUCCESS" || !lookup.data.fileKey) {
    return jsonError(404, "Stored export file is not available.");
  }

  try {
    const signed = await signR2GetObject({ key: lookup.data.fileKey, expiresInSeconds: 300 });
    return NextResponse.redirect(signed, { status: 302 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign export download URL.";
    return jsonError(500, message);
  }
}

async function resolveExportAssetUrls(payload: ExportPayload, viewerSubject: string) {
  const usedAssetIds = new Set(
    payload.frames
      .filter((frame) => frame.type === "IMAGE")
      .map((frame) => (typeof frame.content.assetId === "string" ? frame.content.assetId : null))
      .filter((id): id is string => Boolean(id))
  );
  const r2Assets = payload.assets.filter(
    (asset) =>
      usedAssetIds.has(asset.id) &&
      asset.storageProvider === "R2" &&
      typeof asset.storageKey === "string" &&
      asset.storageKey.length > 0
  );

  if (r2Assets.length > 0) {
    const caps = getR2FreeTierCaps();
    if (caps.hardStopEnabled) {
      const reserve = await convexMutation<unknown>(anyApi.assets.reserveR2ClassBQuota, {
        viewerSubject,
        readOps: r2Assets.length,
        caps: {
          monthlyStorageBytesCap: caps.monthlyStorageBytesCap,
          monthlyClassAOpsCap: caps.monthlyClassAOpsCap,
          monthlyClassBOpsCap: caps.monthlyClassBOpsCap
        }
      });
      if (!reserve.ok) {
        if (reserve.error.includes("R2_FREE_TIER_LIMIT_CLASS_B_MONTHLY")) {
          throw new Error("R2 free-tier Class B operation cap reached for this month.");
        }
        throw new Error("Could not reserve R2 read quota for export.");
      }
    }
  }

  const resolvedAssets = await Promise.all(
    payload.assets.map(async (asset) => {
      if (asset.storageProvider !== "R2" || !asset.storageKey) return asset;
      const signedUrl = await signR2GetObject({
        key: asset.storageKey,
        expiresInSeconds: 600
      });
      return { ...asset, sourceUrl: signedUrl };
    })
  );

  return { ...payload, assets: resolvedAssets };
}

export async function POST(request: Request) { // NOSONAR
  if (!getConvexUrl()) {
    return jsonError(500, "Convex is not configured.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const parsed = body as {
    storybookId?: string;
    exportTarget?: ExportTarget;
    preview?: boolean;
    validateOnly?: boolean;
  };
  if (!parsed.storybookId) return jsonError(400, "storybookId is required.");
  if (parsed.exportTarget !== "DIGITAL_PDF" && parsed.exportTarget !== "HARDCOPY_PRINT_PDF") {
    return jsonError(400, "exportTarget must be DIGITAL_PDF or HARDCOPY_PRINT_PDF.");
  }

  const user = await requireAuthenticatedUser(`/app/storybooks/${parsed.storybookId}/layout`);

  const payloadResult = await convexQuery<ExportPayload>(anyApi.exports.getPdfExportPayload, {
    viewerSubject: user.id,
    storybookId: parsed.storybookId
  });
  if (!payloadResult.ok) {
    const status = payloadResult.error.toLowerCase().includes("forbidden") ? 403 : 500;
    return jsonError(status, "Unable to build export payload.");
  }

  const payload = payloadResult.data;
  const exportHash = computeExportHash({
    storybookId: payload.storybook.id,
    storybookUpdatedAt: payload.storybook.updated_at,
    exportTarget: parsed.exportTarget,
    pages: payload.pages,
    frames: payload.frames
  });
  const cacheKey = `${payload.storybook.id}:${parsed.exportTarget}:${exportHash}`;
  const preflight = buildPreflightResult(payload, parsed.exportTarget);

  if (parsed.validateOnly) {
    return NextResponse.json({
      ok: true,
      exportHash,
      target: parsed.exportTarget,
      canProceed: preflight.ok,
      issues: preflight.issues,
      blockingIssues: preflight.blockingIssues,
      warnings: preflight.warnings,
      pageCount: payload.pages.length
    });
  }

  if (!preflight.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Export blocked by validation issues.",
        exportHash,
        target: parsed.exportTarget,
        issues: preflight.issues,
        blockingIssues: preflight.blockingIssues,
        warnings: preflight.warnings
      },
      { status: 400 }
    );
  }

  const cached = exportCache.get(cacheKey);
  if (cached) {
    const filename = `${toSafeFilenameBase(payload.storybook.title)}-${parsed.exportTarget.toLowerCase()}.pdf`;
    let fileUrl: string | undefined;
    if (cached.fileKey) {
      try {
        fileUrl = await signR2GetObject({ key: cached.fileKey, expiresInSeconds: 300 });
      } catch {
        fileUrl = undefined;
      }
    }
    await recordExportAttemptSafe({
      viewerSubject: user.id,
      storybookId: payload.storybook.id,
      exportTarget: parsed.exportTarget,
      exportHash,
      status: "SUCCESS",
      pageCount: cached.meta.pageCount,
      warningsCount: cached.meta.warnings.length,
      runtimeMs: 0,
      fileKey: cached.fileKey,
      fileUrl
    });
    const response = new NextResponse(new Uint8Array(cached.pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"`,
        "x-export-meta": JSON.stringify({
          ...cached.meta,
          issues: preflight.issues,
          fileKey: cached.fileKey ?? null,
          fileUrl: fileUrl ?? null,
          filename
        })
      }
    });
    return response;
  }

  try {
    const startedAt = Date.now();
    const resolvedPayload = await resolveExportAssetUrls(payload, user.id);
    const contract = toContract(resolvedPayload, parsed.exportTarget);
    const rendered = await renderWithPlaywright(contract, exportHash);
    const filename = `${toSafeFilenameBase(payload.storybook.title)}-${parsed.exportTarget.toLowerCase()}.pdf`;
    let storedFileKey: string | undefined;
    let storedFileUrl: string | undefined;
    if (shouldStoreExportPdfsInR2()) {
      const key = buildExportPdfKey({
        storybookId: payload.storybook.id,
        exportTarget: parsed.exportTarget,
        exportHash
      });
      await putExportPdfToR2({ key, pdf: rendered.pdf });
      storedFileKey = key;
      try {
        storedFileUrl = await signR2GetObject({ key, expiresInSeconds: 300 });
      } catch {
        storedFileUrl = undefined;
      }
    }
    exportCache.set(cacheKey, {
      pdf: rendered.pdf,
      meta: rendered.meta,
      createdAt: Date.now(),
      fileKey: storedFileKey
    });
    await recordExportAttemptSafe({
      viewerSubject: user.id,
      storybookId: payload.storybook.id,
      exportTarget: parsed.exportTarget,
      exportHash,
      status: "SUCCESS",
      pageCount: rendered.meta.pageCount,
      warningsCount: rendered.meta.warnings.length + preflight.warnings.length,
      runtimeMs: Date.now() - startedAt,
      fileKey: storedFileKey,
      fileUrl: storedFileUrl
    });
    const response = new NextResponse(new Uint8Array(rendered.pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `${parsed.preview ? "inline" : "attachment"}; filename="${filename}"`,
        "x-export-meta": JSON.stringify({
          ...rendered.meta,
          issues: preflight.issues,
          blockingIssues: preflight.blockingIssues,
          warningsFromPreflight: preflight.warnings,
          fileKey: storedFileKey ?? null,
          fileUrl: storedFileUrl ?? null,
          filename
        })
      }
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed.";
    await recordExportAttemptSafe({
      viewerSubject: user.id,
      storybookId: payload.storybook.id,
      exportTarget: parsed.exportTarget,
      exportHash,
      status: "FAILED",
      pageCount: payload.pages.length,
      warningsCount: preflight.warnings.length,
      errorSummary: message.slice(0, 500)
    });
    return jsonError(500, message);
  }
}
