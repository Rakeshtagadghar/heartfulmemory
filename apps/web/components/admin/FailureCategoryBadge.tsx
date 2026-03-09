import type { AdminExportFailureCategory } from "../../../../packages/shared/admin/exportMonitoring";

const FAILURE_STYLES: Record<AdminExportFailureCategory, string> = {
  validation_error: "bg-amber-500/15 text-amber-300",
  renderer_error: "bg-rose-500/15 text-rose-300",
  asset_fetch_error: "bg-orange-500/15 text-orange-300",
  storage_error: "bg-cyan-500/15 text-cyan-300",
  timeout: "bg-fuchsia-500/15 text-fuchsia-300",
  infrastructure_error: "bg-blue-500/15 text-blue-300",
  unknown_error: "bg-white/10 text-white/60",
};

export function FailureCategoryBadge({
  category,
}: {
  category: AdminExportFailureCategory | null;
}) {
  if (!category) {
    return <span className="text-xs text-white/35">No failure</span>;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${FAILURE_STYLES[category]}`}
    >
      {category}
    </span>
  );
}
