import Link from "next/link";
import type { AdminProjectExportHistoryItem } from "../../../../packages/shared/admin/exportMonitoring";
import { ExportStatusBadge } from "./ExportStatusBadge";
import { FailureCategoryBadge } from "./FailureCategoryBadge";

export function ProjectExportHistoryPanel({
  items,
  canViewProject,
}: {
  items: AdminProjectExportHistoryItem[];
  canViewProject?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-medium text-white/70">Recent Exports</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-white/35">No exports yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-white/35">{item.format}</p>
                  <p className="mt-1 text-sm text-white/80">
                    <Link href={`/admin/exports/${item.id}`} className="hover:underline">
                      {item.id}
                    </Link>
                  </p>
                </div>
                <ExportStatusBadge status={item.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/45">
                <span>Attempt {item.attemptNumber}</span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
                {item.durationMs !== null ? <span>{item.durationMs} ms</span> : null}
                {item.pageCount !== null ? <span>{item.pageCount} pages</span> : null}
                {canViewProject ? (
                  <Link href={`/admin/projects/${item.projectId}`} className="hover:text-white/70 hover:underline">
                    Project
                  </Link>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <FailureCategoryBadge category={item.failureCategory} />
                {item.failureSummary ? (
                  <p className="text-xs text-white/55">{item.failureSummary}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
