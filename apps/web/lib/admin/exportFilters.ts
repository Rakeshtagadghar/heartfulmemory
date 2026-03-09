import type {
  AdminExportFailureCategory,
  AdminExportJobStatus,
} from "../../../../packages/shared/admin/exportMonitoring";

export type AdminExportsPageSearchParams = {
  q?: string;
  status?: string;
  failureCategory?: string;
  retryEligible?: string;
  page?: string;
};

export function normalizeAdminExportsSearchParams(
  params: AdminExportsPageSearchParams
): {
  q: string | undefined;
  status: AdminExportJobStatus | undefined;
  failureCategory: AdminExportFailureCategory | undefined;
  retryEligible: boolean | undefined;
  page: number;
} {
  const q = params.q?.trim();
  const status =
    params.status === "queued" ||
    params.status === "processing" ||
    params.status === "succeeded" ||
    params.status === "failed"
      ? params.status
      : undefined;
  const failureCategory =
    params.failureCategory === "validation_error" ||
    params.failureCategory === "renderer_error" ||
    params.failureCategory === "asset_fetch_error" ||
    params.failureCategory === "storage_error" ||
    params.failureCategory === "timeout" ||
    params.failureCategory === "infrastructure_error" ||
    params.failureCategory === "unknown_error"
      ? params.failureCategory
      : undefined;
  const retryEligible =
    params.retryEligible === "true"
      ? true
      : params.retryEligible === "false"
        ? false
        : undefined;
  const rawPage = Number(params.page ?? 1);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;

  return {
    q: q ? q : undefined,
    status,
    failureCategory,
    retryEligible,
    page,
  };
}
