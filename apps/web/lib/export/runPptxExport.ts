import { NextResponse } from "next/server";
import { convexMutation, convexQuery, anyApi } from "../convex/ops";
import { generatePptx, type PptxInput, type PptxPage } from "./pptx/generatePptx";
import type { StudioFrame, ResolvedImage } from "./pptx/nodeMappers";
import {
  buildExportArtifactKey,
  getExportMimeType,
  putExportArtifactToR2,
} from "../r2/putExportArtifact";
import { signR2GetObject } from "../r2/server";

type ExportRunSource = "user" | "admin_retry";

type ExportPayload = {
  storybook: { id: string; title: string; subtitle: string | null; settings: Record<string, unknown> };
  pages: {
    id: string;
    order_index: number;
    is_hidden: boolean;
    width_px: number;
    height_px: number;
    background: { fill: string };
  }[];
  frames: {
    id: string;
    page_id: string;
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    z_index: number;
    style: Record<string, unknown>;
    content: Record<string, unknown>;
    crop: Record<string, unknown> | null;
  }[];
  assets: {
    id: string;
    source: string;
    sourceUrl?: string | null;
    storageProvider?: string | null;
    storageKey: string | null;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    license: Record<string, unknown> | null;
  }[];
};

type ExportFrame = ExportPayload["frames"][number];
type ExportAsset = ExportPayload["assets"][number];

export interface RunPptxExportInput {
  viewerSubject: string;
  storybookId: string;
  requestOrigin: string;
  existingJobId?: string | null;
  bypassQuota?: boolean;
  skipUsageIncrement?: boolean;
  triggerSource?: ExportRunSource;
  requestedByUserId?: string | null;
  retryOfJobId?: string | null;
  retrySourceRecordId?: string | null;
  retrySourceRecordKind?: "job" | "attempt" | null;
}

export interface RunPptxExportResult {
  ok: boolean;
  jobId: string;
  artifactId: string | null;
  response: NextResponse;
  code?: string;
}

function getFrameImageReference(frame: ExportFrame): { assetId: string | null; sourceUrl: string | null } {
  const content =
    frame.content && typeof frame.content === "object" && !Array.isArray(frame.content)
      ? frame.content
      : null;

  if (frame.type === "IMAGE") {
    const assetId = typeof content?.assetId === "string" ? content.assetId : null;
    const sourceUrl =
      typeof content?.sourceUrl === "string"
        ? content.sourceUrl
        : typeof content?.previewUrl === "string"
          ? content.previewUrl
          : null;
    return { assetId, sourceUrl };
  }

  if (frame.type === "FRAME") {
    const imageRef =
      content?.imageRef && typeof content.imageRef === "object" && !Array.isArray(content.imageRef)
        ? (content.imageRef as Record<string, unknown>)
        : null;
    const assetId = typeof imageRef?.assetId === "string" ? imageRef.assetId : null;
    const sourceUrl =
      typeof imageRef?.sourceUrl === "string"
        ? imageRef.sourceUrl
        : typeof imageRef?.previewUrl === "string"
          ? imageRef.previewUrl
          : null;
    return { assetId, sourceUrl };
  }

  return { assetId: null, sourceUrl: null };
}

function normalizeFetchUrl(url: string, origin: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) {
    try {
      return new URL(url, origin).toString();
    } catch {
      return url;
    }
  }
  return url;
}

function normalizeMimeType(candidate: string | null | undefined, fallback = "image/png"): string {
  if (!candidate) return fallback;
  const lower = candidate.toLowerCase();
  if (lower.startsWith("image/")) return lower.split(";")[0].trim();
  return fallback;
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: normalizeMimeType(response.headers.get("content-type")),
  };
}

async function resolveFrameImageBinary(input: {
  frame: ExportFrame;
  assetById: Map<string, ExportAsset>;
  requestOrigin: string;
  cache: Map<string, Promise<{ buffer: Buffer; mimeType: string } | null>>;
}): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const reference = getFrameImageReference(input.frame);
  const asset = reference.assetId ? input.assetById.get(reference.assetId) : undefined;

  if (asset?.storageKey) {
    const cacheKey = `r2:${asset.storageKey}`;
    const cached = input.cache.get(cacheKey);
    if (cached) {
      const value = await cached;
      return value ? { ...value, mimeType: normalizeMimeType(asset.mimeType, value.mimeType) } : null;
    }

    const pending = (async () => {
      const signedUrl = await signR2GetObject({ key: asset.storageKey! });
      return fetchImageBuffer(signedUrl);
    })();
    input.cache.set(cacheKey, pending);
    const value = await pending;
    return value ? { ...value, mimeType: normalizeMimeType(asset.mimeType, value.mimeType) } : null;
  }

  const directSourceUrl = asset?.sourceUrl ?? reference.sourceUrl;
  if (!directSourceUrl) return null;

  const normalizedUrl = normalizeFetchUrl(directSourceUrl, input.requestOrigin);
  const cacheKey = `url:${normalizedUrl}`;
  const cached = input.cache.get(cacheKey);
  if (cached) {
    const value = await cached;
    return value ? { ...value, mimeType: normalizeMimeType(asset?.mimeType, value.mimeType) } : null;
  }

  const pending = fetchImageBuffer(normalizedUrl);
  input.cache.set(cacheKey, pending);
  const value = await pending;
  return value ? { ...value, mimeType: normalizeMimeType(asset?.mimeType, value.mimeType) } : null;
}

export async function runPptxExport(input: RunPptxExportInput): Promise<RunPptxExportResult> {
  const startMs = Date.now();

  if (!input.bypassQuota) {
    const quotaResult = await convexQuery<{
      entitlements: { canExportDigital: boolean; exportsRemaining: number | null };
    }>(anyApi.exportUsage.getRemainingForViewer, { viewerSubject: input.viewerSubject });

    if (!quotaResult.ok) {
      return {
        ok: false,
        jobId: input.existingJobId ?? "",
        artifactId: null,
        code: "QUOTA_CHECK_FAILED",
        response: NextResponse.json({ error: "Failed to check quota" }, { status: 500 }),
      };
    }
    if (!quotaResult.data.entitlements.canExportDigital) {
      return {
        ok: false,
        jobId: input.existingJobId ?? "",
        artifactId: null,
        code: "EXPORT_PLAN_UPGRADE_REQUIRED",
        response: NextResponse.json(
          { error: "Upgrade required to export.", code: "EXPORT_PLAN_UPGRADE_REQUIRED" },
          { status: 403 }
        ),
      };
    }
    if (
      quotaResult.data.entitlements.exportsRemaining !== null &&
      quotaResult.data.entitlements.exportsRemaining <= 0
    ) {
      return {
        ok: false,
        jobId: input.existingJobId ?? "",
        artifactId: null,
        code: "EXPORT_QUOTA_EXCEEDED",
        response: NextResponse.json(
          { error: "Monthly export quota exceeded.", code: "EXPORT_QUOTA_EXCEEDED" },
          { status: 403 }
        ),
      };
    }
  }

  let jobId = input.existingJobId ?? null;
  if (!jobId) {
    const jobResult = await convexMutation<{ jobId: string }>(anyApi.exportJobs.createJob, {
      viewerSubject: input.viewerSubject,
      storybookId: input.storybookId,
      type: "pptx",
      triggerSource: input.triggerSource ?? "user",
      requestedByUserId: input.requestedByUserId ?? input.viewerSubject,
      retryOfJobId: input.retryOfJobId ?? null,
      retrySourceRecordId: input.retrySourceRecordId ?? null,
      retrySourceRecordKind: input.retrySourceRecordKind ?? null,
    });
    if (!jobResult.ok) {
      return {
        ok: false,
        jobId: "",
        artifactId: null,
        code: "JOB_CREATE_FAILED",
        response: NextResponse.json({ error: jobResult.error }, { status: 500 }),
      };
    }
    jobId = jobResult.data.jobId;
  }

  await convexMutation(anyApi.exportJobs.updateJobStatus, {
    viewerSubject: input.viewerSubject,
    jobId,
    status: "running",
  });

  try {
    const payload = await convexQuery<ExportPayload>(anyApi.exports.getPdfExportPayload, {
      viewerSubject: input.viewerSubject,
      storybookId: input.storybookId,
    });

    if (!payload.ok) {
      throw new Error(payload.error);
    }

    const { storybook, pages: rawPages, frames: rawFrames, assets } = payload.data;

    const pptxPages: PptxPage[] = rawPages.map((page) => ({
      id: page.id,
      widthPx: page.width_px,
      heightPx: page.height_px,
      background: page.background,
      orderIndex: page.order_index,
      isHidden: page.is_hidden,
    }));

    const framesByPage = new Map<string, StudioFrame[]>();
    for (const frame of rawFrames) {
      const existing = framesByPage.get(frame.page_id) ?? [];
      existing.push({
        id: frame.id,
        type: frame.type as StudioFrame["type"],
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        zIndex: frame.z_index,
        style: frame.style,
        content: frame.content,
        crop: frame.crop,
      });
      framesByPage.set(frame.page_id, existing);
    }

    const resolvedImages = new Map<string, ResolvedImage>();
    const imageFrames = rawFrames.filter((frame) => {
      if (frame.type !== "IMAGE" && frame.type !== "FRAME") return false;
      const reference = getFrameImageReference(frame);
      return Boolean(reference.assetId || reference.sourceUrl);
    });
    const assetById = new Map<string, ExportAsset>(assets.map((asset) => [asset.id, asset]));
    const imageFetchCache = new Map<string, Promise<{ buffer: Buffer; mimeType: string } | null>>();

    for (const frame of imageFrames) {
      try {
        const resolved = await resolveFrameImageBinary({
          frame,
          assetById,
          requestOrigin: input.requestOrigin,
          cache: imageFetchCache,
        });
        if (!resolved) continue;
        resolvedImages.set(frame.id, {
          frameId: frame.id,
          buffer: resolved.buffer,
          mimeType: resolved.mimeType,
        });
      } catch {
        // Skip failed images and continue exporting.
      }
    }

    const pptxInput: PptxInput = {
      title: storybook.title,
      pages: pptxPages,
      framesByPage,
      resolvedImages,
    };
    const result = await generatePptx(pptxInput);

    const r2Key = buildExportArtifactKey({
      storybookId: input.storybookId,
      type: "pptx",
      jobId,
    });
    await putExportArtifactToR2({
      key: r2Key,
      body: result.buffer,
      type: "pptx",
    });

    const filename = `${storybook.title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "export"}.pptx`;
    const artifactResult = await convexMutation<{ artifactId: string }>(
      anyApi.exportJobs.createArtifact,
      {
        viewerSubject: input.viewerSubject,
        storybookId: input.storybookId,
        jobId,
        type: "pptx",
        filename,
        r2Key,
        mimeType: getExportMimeType("pptx"),
        sizeBytes: result.buffer.length,
      }
    );

    if (!artifactResult.ok) {
      throw new Error(artifactResult.error);
    }

    await convexMutation(anyApi.exportJobs.updateJobStatus, {
      viewerSubject: input.viewerSubject,
      jobId,
      status: "done",
      artifactId: artifactResult.data.artifactId,
    });

    if (!input.skipUsageIncrement) {
      await convexMutation(anyApi.exportUsage.incrementUnifiedUsageForViewer, {
        viewerSubject: input.viewerSubject,
      });
    }

    await convexMutation(anyApi.exports.recordExportAttempt, {
      viewerSubject: input.viewerSubject,
      storybookId: input.storybookId,
      exportTarget: "PPTX",
      exportHash: jobId,
      status: "SUCCESS",
      pageCount: result.slideCount,
      warningsCount: result.warnings.length,
      runtimeMs: Date.now() - startMs,
      fileKey: r2Key,
    });

    return {
      ok: true,
      jobId,
      artifactId: artifactResult.data.artifactId,
      response: new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          "content-type": getExportMimeType("pptx"),
          "content-disposition": `attachment; filename="${filename}"`,
          "x-export-meta": JSON.stringify({
            jobId,
            artifactId: artifactResult.data.artifactId,
            filename,
            slideCount: result.slideCount,
            warningsCount: result.warnings.length,
            sizeBytes: result.buffer.length,
            runtimeMs: Date.now() - startMs,
          }),
        },
      }),
    };
  } catch (error) {
    await convexMutation(anyApi.exportJobs.updateJobStatus, {
      viewerSubject: input.viewerSubject,
      jobId,
      status: "error",
      errorCode: "GENERATION_FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      ok: false,
      jobId,
      artifactId: null,
      code: "GENERATION_FAILED",
      response: NextResponse.json(
        {
          error: "PPTX export failed.",
          code: "GENERATION_FAILED",
          details: error instanceof Error ? error.message : undefined,
        },
        { status: 500 }
      ),
    };
  }
}
