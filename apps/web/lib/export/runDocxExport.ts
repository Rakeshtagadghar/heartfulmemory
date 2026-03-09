import { NextResponse } from "next/server";
import { convexMutation, convexQuery, anyApi } from "../convex/ops";
import { generateDocx, orderChaptersForDocx, type DocxChapter, type DocxImage } from "./docx/generateDocx";
import {
  buildExportArtifactKey,
  getExportMimeType,
  putExportArtifactToR2,
} from "../r2/putExportArtifact";
import { signR2GetObject } from "../r2/server";

type ExportRunSource = "user" | "admin_retry";

export interface RunDocxExportInput {
  viewerSubject: string;
  storybookId: string;
  existingJobId?: string | null;
  bypassQuota?: boolean;
  skipUsageIncrement?: boolean;
  triggerSource?: ExportRunSource;
  requestedByUserId?: string | null;
  retryOfJobId?: string | null;
  retrySourceRecordId?: string | null;
  retrySourceRecordKind?: "job" | "attempt" | null;
}

export interface RunDocxExportResult {
  ok: boolean;
  jobId: string;
  artifactId: string | null;
  response: NextResponse;
  code?: string;
}

export async function runDocxExport(input: RunDocxExportInput): Promise<RunDocxExportResult> {
  const startMs = Date.now();

  if (!input.bypassQuota) {
    const quotaResult = await convexQuery<{
      used: number;
      remaining: number | null;
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
      type: "docx",
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
    const payload = await convexQuery<{
      storybook: { id: string; title: string; subtitle: string | null; authorName: string | null };
      chapters: { id: string; title: string; orderIndex: number; chapterKey: string }[];
      answers: { chapterInstanceId: string; questionId: string; answerPlain: string | null }[];
      photos: {
        assetId: string;
        storageKey: string | null;
        mimeType: string | null;
        width: number;
        height: number;
        credit: string | null;
      }[];
    }>(anyApi.exportJobs.getDocxExportPayload, {
      viewerSubject: input.viewerSubject,
      storybookId: input.storybookId,
    });

    if (!payload.ok) {
      throw new Error(payload.error);
    }

    const { storybook, chapters: rawChapters, answers, photos } = payload.data;

    const orderedChapters = orderChaptersForDocx(rawChapters);
    const docxChapters: DocxChapter[] = orderedChapters.map((chapter) => {
      const chapterAnswers = answers
        .filter((answer) => answer.chapterInstanceId === chapter.id)
        .sort((left, right) => left.questionId.localeCompare(right.questionId));
      return {
        title: chapter.title,
        orderIndex: chapter.orderIndex,
        paragraphs: chapterAnswers
          .map((answer) => answer.answerPlain)
          .filter((text): text is string => Boolean(text)),
      };
    });

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
        // Skip failed images and continue exporting.
      }
    }

    const docxBuffer = await generateDocx({
      title: storybook.title,
      subtitle: storybook.subtitle,
      authorName: storybook.authorName,
      chapters: docxChapters,
      images: docxImages,
    });

    const r2Key = buildExportArtifactKey({
      storybookId: input.storybookId,
      type: "docx",
      jobId,
    });
    await putExportArtifactToR2({
      key: r2Key,
      body: docxBuffer,
      type: "docx",
    });

    const filename = `${storybook.title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "export"}.docx`;
    const artifactResult = await convexMutation<{ artifactId: string }>(
      anyApi.exportJobs.createArtifact,
      {
        viewerSubject: input.viewerSubject,
        storybookId: input.storybookId,
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
      exportTarget: "DOCX",
      exportHash: jobId,
      status: "SUCCESS",
      pageCount: docxChapters.length,
      warningsCount: 0,
      runtimeMs: Date.now() - startMs,
      fileKey: r2Key,
    });

    return {
      ok: true,
      jobId,
      artifactId: artifactResult.data.artifactId,
      response: new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          "content-type": getExportMimeType("docx"),
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
          error: "DOCX export failed.",
          code: "GENERATION_FAILED",
          details: error instanceof Error ? error.message : undefined,
        },
        { status: 500 }
      ),
    };
  }
}
