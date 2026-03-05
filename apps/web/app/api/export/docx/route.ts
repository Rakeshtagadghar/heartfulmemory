import { NextRequest, NextResponse } from "next/server";
import { requireExportAccess } from "../../../../lib/export/authz";
import { checkExportRateLimit } from "../../../../lib/export/rateLimit";
import { convexQuery, convexMutation, anyApi } from "../../../../lib/convex/ops";
import { generateDocx, orderChaptersForDocx, type DocxChapter, type DocxImage } from "../../../../lib/export/docx/generateDocx";
import {
  buildExportArtifactKey,
  getExportMimeType,
  putExportArtifactToR2,
} from "../../../../lib/r2/putExportArtifact";
import { signR2GetObject } from "../../../../lib/r2/server";

export async function POST(request: NextRequest) {
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
      { error: "Export rate limit exceeded. Please wait a moment.", code: "RATE_LIMIT" },
      { status: 429 }
    );
  }

  // 4. Check quota
  const quotaResult = await convexQuery<{
    used: number;
    remaining: number | null;
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
    { viewerSubject: viewer.id, storybookId, type: "docx" }
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
    // 7. Fetch content payload
    const payload = await convexQuery<{
      storybook: { id: string; title: string; subtitle: string | null; authorName: string | null };
      chapters: { id: string; title: string; orderIndex: number; chapterKey: string }[];
      answers: { chapterInstanceId: string; questionId: string; answerPlain: string | null }[];
      photos: { assetId: string; storageKey: string | null; mimeType: string | null; width: number; height: number; credit: string | null }[];
    }>(anyApi.exportJobs.getDocxExportPayload, {
      viewerSubject: viewer.id,
      storybookId,
    });

    if (!payload.ok) {
      throw new Error(payload.error);
    }

    const { storybook, chapters: rawChapters, answers, photos } = payload.data;

    // 8. Build DOCX input
    const orderedChapters = orderChaptersForDocx(rawChapters);
    const docxChapters: DocxChapter[] = orderedChapters.map((ch) => {
      const chAnswers = answers
        .filter((a) => a.chapterInstanceId === ch.id)
        .sort((a, b) => a.questionId.localeCompare(b.questionId));
      return {
        title: ch.title,
        orderIndex: ch.orderIndex,
        paragraphs: chAnswers
          .map((a) => a.answerPlain)
          .filter((t): t is string => Boolean(t)),
      };
    });

    // 9. Fetch images from R2
    const docxImages: DocxImage[] = [];
    for (const photo of photos) {
      if (!photo.storageKey) continue;
      try {
        const signedUrl = await signR2GetObject({ key: photo.storageKey });
        const response = await fetch(signedUrl);
        if (!response.ok) continue;
        const arrayBuffer = await response.arrayBuffer();
        docxImages.push({
          buffer: Buffer.from(arrayBuffer),
          width: photo.width || 400,
          height: photo.height || 300,
          mimeType: photo.mimeType ?? undefined,
          credit: photo.credit ?? undefined,
        });
      } catch {
        // Skip failed images
      }
    }

    // 10. Generate DOCX
    const docxBuffer = await generateDocx({
      title: storybook.title,
      subtitle: storybook.subtitle,
      authorName: storybook.authorName,
      chapters: docxChapters,
      images: docxImages,
    });

    // 11. Upload to R2
    const r2Key = buildExportArtifactKey({
      storybookId,
      type: "docx",
      jobId,
    });
    await putExportArtifactToR2({
      key: r2Key,
      body: docxBuffer,
      type: "docx",
    });

    // 12. Create artifact record
    const filename = `${storybook.title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "export"}.docx`;
    const artifactResult = await convexMutation<{ artifactId: string }>(
      anyApi.exportJobs.createArtifact,
      {
        viewerSubject: viewer.id,
        storybookId,
        jobId,
        type: "docx",
        filename,
        r2Key,
        mimeType: getExportMimeType("docx"),
        sizeBytes: docxBuffer.length,
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
      exportTarget: "DOCX",
      exportHash: jobId,
      status: "SUCCESS",
      pageCount: docxChapters.length,
      warningsCount: 0,
      runtimeMs: Date.now() - startMs,
      fileKey: r2Key,
    });

    // 16. Return file
    const mimeType = getExportMimeType("docx");
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "content-type": mimeType,
        "content-disposition": `attachment; filename="${filename}"`,
        "x-export-meta": JSON.stringify({
          jobId,
          artifactId: artifactResult.data.artifactId,
          filename,
          chapterCount: docxChapters.length,
          imageCount: docxImages.length,
          sizeBytes: docxBuffer.length,
          runtimeMs: Date.now() - startMs,
        }),
      },
    });
  } catch (error) {
    // Mark job as error
    await convexMutation(anyApi.exportJobs.updateJobStatus, {
      viewerSubject: viewer.id,
      jobId,
      status: "error",
      errorCode: "GENERATION_FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "DOCX export failed.",
        code: "GENERATION_FAILED",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
