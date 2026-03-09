import { NextResponse } from "next/server";
import { anyApi, convexMutation } from "../../../../../../lib/convex/ops";
import { getAdminExportJobDetail, writeAuditLog } from "../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../lib/admin/requireAdmin";
import { runDocxExport } from "../../../../../../lib/export/runDocxExport";
import { runPptxExport } from "../../../../../../lib/export/runPptxExport";
import { runPdfExport } from "../../../../export/pdf/route";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." },
  },
  { status: 403 }
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ exportId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("exports.retry");
  if (!ctx) return FORBIDDEN;

  const { exportId } = await params;
  const exportJob = await getAdminExportJobDetail(exportId, {
    includeOwnerEmail: true,
    includeFailureSummary: true,
  });

  if (!exportJob) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Resource not found." } },
      { status: 404 }
    );
  }

  if (!exportJob.ownerId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "RETRY_NOT_ALLOWED", message: "This export job cannot be retried." },
      },
      { status: 409 }
    );
  }

  if (!exportJob.retryEligibility.eligible) {
    void writeAuditLog({
      adminUserId: ctx.adminId,
      actorUserId: ctx.userId,
      eventType: "admin_export_retry_blocked",
      resourceType: "export",
      resourceId: exportId,
      action: "retry",
      metadataJson: {
        projectId: exportJob.projectId,
        reason: exportJob.retryEligibility.reasonCode,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RETRY_NOT_ALLOWED",
          message:
            exportJob.retryEligibility.blockReason ?? "This export job cannot be retried.",
        },
      },
      { status: 409 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_export_retry_requested",
    resourceType: "export",
    resourceId: exportId,
    action: "retry",
    metadataJson: {
      projectId: exportJob.projectId,
      format: exportJob.format,
      source: exportJob.source,
    },
  });

  const createRetryResult = await convexMutation<{
    ok: boolean;
    jobId?: string;
    code?: string;
    existingJobId?: string;
  }>(anyApi.exportJobs.createAdminRetryJob, {
    viewerSubject: exportJob.ownerId,
    storybookId: exportJob.projectId,
    type: exportJob.format,
    requestedByUserId: ctx.userId,
    retryOfJobId: exportJob.jobId ?? null,
    retrySourceRecordId: exportJob.sourceRecordId,
    retrySourceRecordKind: exportJob.source,
  });

  if (!createRetryResult.ok || !createRetryResult.data.ok || !createRetryResult.data.jobId) {
    const code = createRetryResult.ok ? createRetryResult.data.code : "RETRY_CREATE_FAILED";
    void writeAuditLog({
      adminUserId: ctx.adminId,
      actorUserId: ctx.userId,
      eventType: "admin_export_retry_blocked",
      resourceType: "export",
      resourceId: exportId,
      action: "retry",
      metadataJson: {
        projectId: exportJob.projectId,
        code,
        existingJobId: createRetryResult.ok ? createRetryResult.data.existingJobId ?? null : null,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: code ?? "RETRY_NOT_ALLOWED",
          message: "This export job cannot be retried right now.",
        },
      },
      { status: 409 }
    );
  }

  const newJobId = createRetryResult.data.jobId;
  let runResult:
    | Awaited<ReturnType<typeof runPdfExport>>
    | Awaited<ReturnType<typeof runDocxExport>>
    | Awaited<ReturnType<typeof runPptxExport>>;

  if (exportJob.format === "pdf") {
    runResult = await runPdfExport({
      viewerSubject: exportJob.ownerId,
      body: {
        storybookId: exportJob.projectId,
        exportTarget:
          exportJob.exportTarget === "HARDCOPY_PRINT_PDF"
            ? "HARDCOPY_PRINT_PDF"
            : "DIGITAL_PDF",
      },
      bypassPasswordGate: true,
      bypassBillingGuard: true,
      bypassRateLimit: true,
      skipUsageIncrement: true,
      trackedJob: {
        jobId: newJobId,
        forceExportHash: newJobId,
      },
    });
  } else if (exportJob.format === "docx") {
    runResult = await runDocxExport({
      viewerSubject: exportJob.ownerId,
      storybookId: exportJob.projectId,
      existingJobId: newJobId,
      bypassQuota: true,
      skipUsageIncrement: true,
      triggerSource: "admin_retry",
      requestedByUserId: ctx.userId,
      retryOfJobId: exportJob.jobId,
      retrySourceRecordId: exportJob.sourceRecordId,
      retrySourceRecordKind: exportJob.source,
    });
  } else {
    const requestUrl = new URL(request.url);
    runResult = await runPptxExport({
      viewerSubject: exportJob.ownerId,
      storybookId: exportJob.projectId,
      requestOrigin: requestUrl.origin,
      existingJobId: newJobId,
      bypassQuota: true,
      skipUsageIncrement: true,
      triggerSource: "admin_retry",
      requestedByUserId: ctx.userId,
      retryOfJobId: exportJob.jobId,
      retrySourceRecordId: exportJob.sourceRecordId,
      retrySourceRecordKind: exportJob.source,
    });
  }

  if (!runResult.ok) {
    void writeAuditLog({
      adminUserId: ctx.adminId,
      actorUserId: ctx.userId,
      eventType: "admin_export_retry_failed",
      resourceType: "export",
      resourceId: exportId,
      action: "retry",
      metadataJson: {
        projectId: exportJob.projectId,
        originalJobId: exportJob.jobId,
        newJobId,
        code: runResult.code ?? null,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: runResult.code ?? "EXPORT_RETRY_FAILED",
          message: "Retry failed.",
        },
        data: {
          originalJobId: exportJob.id,
          newJobId,
          status: "failed",
        },
      },
      { status: 500 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_export_retry_queued",
    resourceType: "export",
    resourceId: exportId,
    action: "retry",
    metadataJson: {
      projectId: exportJob.projectId,
      originalJobId: exportJob.jobId,
      newJobId,
      format: exportJob.format,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      originalJobId: exportJob.id,
      newJobId,
      status: "succeeded",
    },
  });
}
