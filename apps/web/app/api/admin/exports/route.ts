import { NextResponse } from "next/server";
import { hasPermission } from "../../../../../../packages/shared/admin/rbac";
import { listAdminExportJobs, writeAuditLog } from "../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../lib/admin/requireAdmin";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
  },
  { status: 403 }
);

function parseDateParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return Math.floor(asNumber);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

export async function GET(request: Request) {
  const ctx = await requireAdminPermissionForApi("exports.view");
  if (!ctx) return FORBIDDEN;

  const url = new URL(request.url);
  const rawStatus = url.searchParams.get("status");
  const status =
    rawStatus === "queued" ||
    rawStatus === "processing" ||
    rawStatus === "succeeded" ||
    rawStatus === "failed"
      ? rawStatus
      : undefined;
  const rawFailureCategory = url.searchParams.get("failureCategory");
  const failureCategory =
    rawFailureCategory === "validation_error" ||
    rawFailureCategory === "renderer_error" ||
    rawFailureCategory === "asset_fetch_error" ||
    rawFailureCategory === "storage_error" ||
    rawFailureCategory === "timeout" ||
    rawFailureCategory === "infrastructure_error" ||
    rawFailureCategory === "unknown_error"
      ? rawFailureCategory
      : undefined;
  const rawSortBy = url.searchParams.get("sortBy");
  const sortBy =
    rawSortBy === "completedAt" || rawSortBy === "duration" ? rawSortBy : "createdAt";

  const result = await listAdminExportJobs(
    {
      q: url.searchParams.get("q") ?? undefined,
      status,
      failureCategory,
      retryEligible: parseBooleanParam(url.searchParams.get("retryEligible")),
      dateFrom: parseDateParam(url.searchParams.get("dateFrom")),
      dateTo: parseDateParam(url.searchParams.get("dateTo")),
      sortBy,
      sortOrder: url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
      page: parsePositiveInt(url.searchParams.get("page"), 1, 100000),
      pageSize: parsePositiveInt(url.searchParams.get("pageSize"), 25, 100),
    },
    {
      includeOwnerEmail: hasPermission(ctx.role, "users.view"),
      includeFailureSummary: hasPermission(ctx.role, "support.view"),
    }
  );

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_export_list_viewed",
    resourceType: "export",
    action: "view",
    metadataJson: {
      query: url.searchParams.get("q") ? `${url.searchParams.get("q")?.slice(0, 3)}***` : null,
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
    },
  });

  return NextResponse.json({ success: true, data: result });
}
