import type { AdminExportJobStatus } from "../../../../packages/shared/admin/exportMonitoring";

const STATUS_STYLES: Record<AdminExportJobStatus, string> = {
  queued: "bg-sky-500/15 text-sky-300",
  processing: "bg-blue-500/15 text-blue-300",
  succeeded: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-rose-500/15 text-rose-300",
};

export function ExportStatusBadge({ status }: { status: AdminExportJobStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
