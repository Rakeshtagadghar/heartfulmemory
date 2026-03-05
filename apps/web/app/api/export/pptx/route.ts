import { NextRequest, NextResponse } from "next/server";
import { requireExportAccess } from "../../../../lib/export/authz";
import { checkExportRateLimit } from "../../../../lib/export/rateLimit";
import { convexQuery, convexMutation, anyApi } from "../../../../lib/convex/ops";
import {
  generatePptx,
  type PptxPage,
  type PptxInput,
} from "../../../../lib/export/pptx/generatePptx";
import type { StudioFrame, ResolvedImage } from "../../../../lib/export/pptx/nodeMappers";
import {
  buildExportArtifactKey,
  getExportMimeType,
  putExportArtifactToR2,
} from "../../../../lib/r2/putExportArtifact";
import { signR2GetObject } from "../../../../lib/r2/server";

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

function getFrameImageReference(frame: ExportFrame): { assetId: string | null; sourceUrl: string | null } {
  const content =
    frame.content && typeof frame.content === "object" && !Array.isArray(frame.content)
      ? (frame.content)
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

export async function POST(request: NextRequest) { //NOSONAR
  const startMs = Date.now();

  // 1. Auth
  let viewer;
  try {
    viewer = await requireExportAccess("");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: { storybookId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const storybookId = body.storybookId;
  if (!storybookId) {
    return NextResponse.json({ error: "storybookId required" }, { status: 400 });
  }

  // 3. Rate limit
  const rateLimitResult = checkExportRateLimit(viewer.id);
  if (!rateLimitResult.ok) {
    return NextResponse.json(
      { error: "Export rate limit exceeded.", code: "RATE_LIMIT" },
      { status: 429 }
    );
  }

  // 4. Check quota
  const quotaResult = await convexQuery<{
    entitlements: { canExportDigital: boolean; exportsRemaining: number | null };
  }>(anyApi.exportUsage.getRemainingForViewer, { viewerSubject: viewer.id });

  if (!quotaResult.ok) {
    return NextResponse.json({ error: "Failed to check quota" }, { status: 500 });
  }
  if (!quotaResult.data.entitlements.canExportDigital) {
    return NextResponse.json(
      { error: "Upgrade required to export.", code: "EXPORT_PLAN_UPGRADE_REQUIRED" },
      { status: 403 }
    );
  }
  if (quotaResult.data.entitlements.exportsRemaining !== null && quotaResult.data.entitlements.exportsRemaining <= 0) {
    return NextResponse.json(
      { error: "Monthly export quota exceeded.", code: "EXPORT_QUOTA_EXCEEDED" },
      { status: 403 }
    );
  }

  // 5. Create job
  const jobResult = await convexMutation<{ jobId: string }>(
    anyApi.exportJobs.createJob,
    { viewerSubject: viewer.id, storybookId, type: "pptx" }
  );
  if (!jobResult.ok) {
    return NextResponse.json({ error: jobResult.error }, { status: 500 });
  }
  const jobId = jobResult.data.jobId;

  // 6. Mark running
  await convexMutation(anyApi.exportJobs.updateJobStatus, {
    viewerSubject: viewer.id,
    jobId,
    status: "running",
  });

  try {
    // 7. Fetch Studio doc payload (reuse PDF's payload query)
    const payload = await convexQuery<ExportPayload>(
      anyApi.exports.getPdfExportPayload,
      { viewerSubject: viewer.id, storybookId }
    );

    if (!payload.ok) {
      throw new Error(payload.error);
    }

    const { storybook, pages: rawPages, frames: rawFrames, assets } = payload.data;

    // 8. Map to PPTX types
    const pptxPages: PptxPage[] = rawPages.map((p) => ({
      id: p.id,
      widthPx: p.width_px,
      heightPx: p.height_px,
      background: p.background,
      orderIndex: p.order_index,
      isHidden: p.is_hidden,
    }));

    const framesByPage = new Map<string, StudioFrame[]>();
    for (const f of rawFrames) {
      const existing = framesByPage.get(f.page_id) ?? [];
      existing.push({
        id: f.id,
        type: f.type as StudioFrame["type"],
        x: f.x,
        y: f.y,
        w: f.w,
        h: f.h,
        zIndex: f.z_index,
        style: f.style,
        content: f.content,
        crop: f.crop,
      });
      framesByPage.set(f.page_id, existing);
    }

    // 9. Resolve images for IMAGE and FRAME(imageRef) nodes.
    const resolvedImages = new Map<string, ResolvedImage>();
    const imageFrames = rawFrames.filter((f) => {
      if (f.type !== "IMAGE" && f.type !== "FRAME") return false;
      const ref = getFrameImageReference(f);
      return Boolean(ref.assetId || ref.sourceUrl);
    });
    const assetById = new Map<string, ExportAsset>(assets.map((asset) => [asset.id, asset]));
    const imageFetchCache = new Map<string, Promise<{ buffer: Buffer; mimeType: string } | null>>();

    for (const frame of imageFrames) {
      try {
        const resolved = await resolveFrameImageBinary({
          frame,
          assetById,
          requestOrigin: request.nextUrl.origin,
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

    // 10. Generate PPTX
    const pptxInput: PptxInput = {
      title: storybook.title,
      pages: pptxPages,
      framesByPage,
      resolvedImages,
    };
    const result = await generatePptx(pptxInput);

    // 11. Upload to R2
    const r2Key = buildExportArtifactKey({
      storybookId,
      type: "pptx",
      jobId,
    });
    await putExportArtifactToR2({
      key: r2Key,
      body: result.buffer,
      type: "pptx",
    });

    // 12. Create artifact record
    const filename = `${storybook.title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "export"}.pptx`;
    const artifactResult = await convexMutation<{ artifactId: string }>(
      anyApi.exportJobs.createArtifact,
      {
        viewerSubject: viewer.id,
        storybookId,
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

    // 13. Mark done
    await convexMutation(anyApi.exportJobs.updateJobStatus, {
      viewerSubject: viewer.id,
      jobId,
      status: "done",
      artifactId: artifactResult.data.artifactId,
    });

    // 14. Increment unified quota
    await convexMutation(anyApi.exportUsage.incrementUnifiedUsageForViewer, {
      viewerSubject: viewer.id,
    });

    // 15. Record in exports table
    await convexMutation(anyApi.exports.recordExportAttempt, {
      viewerSubject: viewer.id,
      storybookId,
      exportTarget: "PPTX",
      exportHash: jobId,
      status: "SUCCESS",
      pageCount: result.slideCount,
      warningsCount: result.warnings.length,
      runtimeMs: Date.now() - startMs,
      fileKey: r2Key,
    });

    // 16. Return file
    const mimeType = getExportMimeType("pptx");
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "content-type": mimeType,
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
    });
  } catch (error) {
    await convexMutation(anyApi.exportJobs.updateJobStatus, {
      viewerSubject: viewer.id,
      jobId,
      status: "error",
      errorCode: "GENERATION_FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "PPTX export failed.",
        code: "GENERATION_FAILED",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
