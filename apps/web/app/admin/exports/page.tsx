import Link from "next/link";
import { hasPermission } from "../../../../../packages/shared/admin/rbac";
import { FailureCategoryBadge } from "../../../components/admin/FailureCategoryBadge";
import { ExportStatusBadge } from "../../../components/admin/ExportStatusBadge";
import { listAdminExportJobs } from "../../../lib/admin/adminOps";
import {
  normalizeAdminExportsSearchParams,
  type AdminExportsPageSearchParams,
} from "../../../lib/admin/exportFilters";
import { requireAdminWithPermission } from "../../../lib/admin/requireAdmin";

function PaginationLink({
  label,
  href,
  disabled,
}: {
  label: string;
  href: string;
  disabled: boolean;
}) {
  if (disabled) {
    return <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/30">{label}</span>;
  }
  return (
    <Link
      href={href}
      className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 transition hover:bg-white/[0.08] hover:text-white"
    >
      {label}
    </Link>
  );
}

export default async function AdminExportsPage({
  searchParams,
}: {
  searchParams: Promise<AdminExportsPageSearchParams>;
}) {
  const admin = await requireAdminWithPermission("exports.view");
  const params = normalizeAdminExportsSearchParams(await searchParams);
  const page = params.page;
  const result = await listAdminExportJobs(
    {
      q: params.q,
      status: params.status,
      failureCategory: params.failureCategory,
      retryEligible: params.retryEligible,
      page,
      pageSize: 25,
    },
    {
      includeOwnerEmail: hasPermission(admin.role, "users.view"),
      includeFailureSummary: hasPermission(admin.role, "support.view"),
    }
  );

  const totalPages = Math.max(1, Math.ceil(result.pagination.total / result.pagination.pageSize));
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.failureCategory) query.set("failureCategory", params.failureCategory);
  if (typeof params.retryEligible === "boolean") {
    query.set("retryEligible", String(params.retryEligible));
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Exports</h1>
      <p className="mt-1 text-sm text-white/50">
        Browse export attempts, inspect failures, and retry eligible jobs.
      </p>

      <form className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search by project, user, job, or export id"
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 md:col-span-2"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All statuses</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="succeeded">Succeeded</option>
          <option value="failed">Failed</option>
        </select>
        <select
          name="retryEligible"
          defaultValue={
            params.retryEligible === true ? "true" : params.retryEligible === false ? "false" : ""
          }
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All retry states</option>
          <option value="true">Retry eligible</option>
          <option value="false">Retry blocked</option>
        </select>
        <select
          name="failureCategory"
          defaultValue={params.failureCategory ?? ""}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All failure categories</option>
          <option value="validation_error">Validation</option>
          <option value="renderer_error">Renderer</option>
          <option value="asset_fetch_error">Asset fetch</option>
          <option value="storage_error">Storage</option>
          <option value="timeout">Timeout</option>
          <option value="infrastructure_error">Infrastructure</option>
          <option value="unknown_error">Unknown</option>
        </select>
        <div className="flex items-center gap-2 md:col-span-3">
          <button
            type="submit"
            className="rounded-lg bg-white/[0.07] px-3 py-2 text-sm text-white transition hover:bg-white/[0.12]"
          >
            Apply filters
          </button>
          <Link
            href="/admin/exports"
            className="rounded-lg px-3 py-2 text-sm text-white/50 transition hover:bg-white/[0.05] hover:text-white/80"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        {result.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/35">No exports matched these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/35">
                  <th className="px-2 py-2">Job</th>
                  <th className="px-2 py-2">Project</th>
                  <th className="px-2 py-2">Owner</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Failure</th>
                  <th className="px-2 py-2">Attempt</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 align-top">
                    <td className="px-2 py-3">
                      <Link href={`/admin/exports/${item.id}`} className="font-mono text-xs text-white/75 hover:underline">
                        {item.id}
                      </Link>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/30">
                        {item.format}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/admin/projects/${item.projectId}`} className="text-white/75 hover:underline">
                        {item.projectTitle}
                      </Link>
                      <p className="mt-1 text-[11px] font-mono text-white/30">{item.projectId}</p>
                    </td>
                    <td className="px-2 py-3 text-white/60">
                      <p>{item.ownerDisplayName ?? "User"}</p>
                      {item.ownerEmail ? <p className="mt-1 text-xs text-white/35">{item.ownerEmail}</p> : null}
                    </td>
                    <td className="px-2 py-3">
                      <ExportStatusBadge status={item.status} />
                    </td>
                    <td className="px-2 py-3">
                      <FailureCategoryBadge category={item.failureCategory} />
                      {item.failureSummary ? <p className="mt-1 text-xs text-white/45">{item.failureSummary}</p> : null}
                    </td>
                    <td className="px-2 py-3 text-white/60">{item.attemptNumber}</td>
                    <td className="px-2 py-3 text-white/45">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-2 py-3 text-white/45">
                      {item.durationMs !== null ? `${item.durationMs} ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-white/35">
            Showing page {result.pagination.page} of {totalPages} ({result.pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <PaginationLink
              label="Previous"
              disabled={page <= 1}
              href={`/admin/exports?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page - 1) }).toString()}`}
            />
            <PaginationLink
              label="Next"
              disabled={page >= totalPages}
              href={`/admin/exports?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page + 1) }).toString()}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
