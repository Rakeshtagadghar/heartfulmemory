import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { convexMutation, convexQuery, anyApi, getConvexUrl } from "../../../../lib/convex/ops";
import { computeExportHash } from "../../../../lib/export/exportHash";
import { signR2GetObject } from "../../../../lib/r2/server";
import { getR2FreeTierCaps } from "../../../../lib/uploads/r2Quota";
import type { ExportTarget, PdfRenderContract, PdfRenderOutputMeta } from "../../../../../../packages/pdf-renderer/src/contracts";
import { renderWithPlaywright } from "../../../../../../packages/pdf-renderer/src/renderWithPlaywright";

export const runtime = "nodejs";

const exportCache = new Map<string, { pdf: Buffer; meta: PdfRenderOutputMeta; createdAt: number }>();

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
  return {
    exportTarget,
    storybook: {
      id: payload.storybook.id,
      title: payload.storybook.title,
      subtitle: payload.storybook.subtitle,
      updatedAt: payload.storybook.updated_at,
      settings: payload.storybook.settings ?? {}
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

export async function POST(request: Request) {
  if (!getConvexUrl()) {
    return jsonError(500, "Convex is not configured.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const parsed = body as { storybookId?: string; exportTarget?: ExportTarget; preview?: boolean };
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
  const missingLicenseAssets = missingLicenseForReferencedStockAssets(payload);
  if (missingLicenseAssets.length > 0) {
    return jsonError(400, "Export blocked: one or more stock images are missing license metadata.");
  }

  const exportHash = computeExportHash({
    storybookId: payload.storybook.id,
    storybookUpdatedAt: payload.storybook.updated_at,
    exportTarget: parsed.exportTarget,
    pages: payload.pages,
    frames: payload.frames
  });
  const cacheKey = `${payload.storybook.id}:${parsed.exportTarget}:${exportHash}`;
  const cached = exportCache.get(cacheKey);
  if (cached) {
    const filename = `${toSafeFilenameBase(payload.storybook.title)}-${parsed.exportTarget.toLowerCase()}.pdf`;
    const response = new NextResponse(new Uint8Array(cached.pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"`,
        "x-export-meta": JSON.stringify({
          ...cached.meta,
          filename
        })
      }
    });
    return response;
  }

  try {
    const resolvedPayload = await resolveExportAssetUrls(payload, user.id);
    const contract = toContract(resolvedPayload, parsed.exportTarget);
    const rendered = await renderWithPlaywright(contract, exportHash);
    const filename = `${toSafeFilenameBase(payload.storybook.title)}-${parsed.exportTarget.toLowerCase()}.pdf`;
    exportCache.set(cacheKey, { pdf: rendered.pdf, meta: rendered.meta, createdAt: Date.now() });
    const response = new NextResponse(new Uint8Array(rendered.pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `${parsed.preview ? "inline" : "attachment"}; filename="${filename}"`,
        "x-export-meta": JSON.stringify({ ...rendered.meta, filename })
      }
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed.";
    return jsonError(500, message);
  }
}
