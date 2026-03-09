import Link from "next/link";
import { redirect } from "next/navigation";
import { hasPermission } from "../../../../../../packages/shared/admin/rbac";
import { FailureCategoryBadge } from "../../../../components/admin/FailureCategoryBadge";
import { ExportStatusBadge } from "../../../../components/admin/ExportStatusBadge";
import { RetryExportButton } from "../../../../components/admin/RetryExportButton";
import { getAdminExportJobDetail, writeAuditLog } from "../../../../lib/admin/adminOps";
import { requireAdminWithPermission } from "../../../../lib/admin/requireAdmin";

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right text-white/70">{value ?? "—"}</span>
    </div>
  );
}

export default async function AdminExportDetailPage({
  params,
}: {
  params: Promise<{ exportId: string }>;
}) {
  const admin = await requireAdminWithPermission("exports.view");
  const { exportId } = await params;
  const exportJob = await getAdminExportJobDetail(exportId, {
    includeOwnerEmail: hasPermission(admin.role, "users.view"),
    includeFailureSummary: hasPermission(admin.role, "support.view"),
  });

  if (!exportJob) {
    redirect("/admin/exports");
  }

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_export_viewed",
    resourceType: "export",
    resourceId: exportId,
    action: "view",
    metadataJson: {
      projectId: exportJob.projectId,
      status: exportJob.status,
    },
  });

  const canRetry = hasPermission(admin.role, "exports.retry");

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/exports" className="text-xs text-white/40 hover:text-white/70">
          &larr; Back to Exports
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">{exportJob.format}</p>
              <h1 className="mt-1 break-all font-mono text-sm text-white/80">{exportJob.id}</h1>
            </div>
            <ExportStatusBadge status={exportJob.status} />
          </div>
          <div className="mt-4">
            <InfoRow label="Project" value={exportJob.projectTitle} />
            <InfoRow label="Project ID" value={exportJob.projectId} />
            <InfoRow label="Attempt" value={exportJob.attemptNumber} />
            <InfoRow label="Trigger" value={exportJob.triggerSource} />
            <InfoRow label="Created" value={new Date(exportJob.createdAt).toLocaleString()} />
            <InfoRow
              label="Completed"
              value={exportJob.completedAt ? new Date(exportJob.completedAt).toLocaleString() : null}
            />
            <InfoRow label="Duration" value={exportJob.durationMs !== null ? `${exportJob.durationMs} ms` : null} />
            <InfoRow label="Owner" value={exportJob.ownerEmail ?? exportJob.ownerDisplayName} />
          </div>
          <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-white/35">Project</p>
            <Link href={`/admin/projects/${exportJob.projectId}`} className="mt-2 block text-sm text-white/75 hover:underline">
              Open project detail
            </Link>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/70">Failure</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FailureCategoryBadge category={exportJob.failureCategory} />
              {exportJob.failureCode ? <span className="font-mono text-xs text-white/35">{exportJob.failureCode}</span> : null}
            </div>
            {exportJob.failureSummary ? (
              <p className="mt-3 text-sm leading-6 text-white/65">{exportJob.failureSummary}</p>
            ) : (
              <p className="mt-3 text-sm text-white/40">No failure summary for this export.</p>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/70">Retry</h2>
            <p className="mt-2 text-sm text-white/50">
              {exportJob.retryEligibility.eligible
                ? "This export is eligible for a server-side retry."
                : exportJob.retryEligibility.blockReason ?? "Retry is not available."}
            </p>
            {canRetry ? (
              <div className="mt-4">
                <RetryExportButton
                  exportId={exportJob.id}
                  disabledReason={exportJob.retryEligibility.eligible ? null : exportJob.retryEligibility.blockReason}
                />
              </div>
            ) : (
              <p className="mt-4 text-xs text-white/35">Your role cannot trigger retries.</p>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/70">Output</h2>
            <div className="mt-3">
              <InfoRow label="Warnings" value={exportJob.warningsCount} />
              <InfoRow label="Page Count" value={exportJob.pageCount} />
              <InfoRow label="Retry Of Job" value={exportJob.retryOfJobId} />
              <InfoRow label="Artifact" value={exportJob.outputArtifactSummary?.filename ?? null} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
