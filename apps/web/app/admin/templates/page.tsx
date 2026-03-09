import Link from "next/link";
import { hasPermission } from "../../../../../packages/shared/admin/rbac";
import {
  ADMIN_TEMPLATE_CATEGORIES,
  ADMIN_TEMPLATE_COMPATIBILITY_FILTERS,
  ADMIN_TEMPLATE_GUIDED_LEVELS,
  ADMIN_TEMPLATE_TYPES,
  ADMIN_TEMPLATE_VISIBILITIES,
  formatAdminTemplateEnumLabel,
  normalizeAdminTemplateCategory,
  normalizeAdminTemplateCompatibilityFilter,
  normalizeAdminTemplateGuidedLevel,
  normalizeAdminTemplateStatus,
  normalizeAdminTemplateType,
  normalizeAdminTemplateVisibility,
} from "../../../../../packages/shared/admin/templates";
import { TemplateOrderingManager } from "../../../components/admin/TemplateOrderingManager";
import { listAdminTemplates, writeAuditLog } from "../../../lib/admin/adminOps";
import { requireAdminWithPermission } from "../../../lib/admin/requireAdmin";

type TemplatesPageSearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
  type?: string | string[];
  visibility?: string | string[];
  category?: string | string[];
  guidedLevel?: string | string[];
  compatibility?: string | string[];
  page?: string | string[];
}>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warning";
}) {
  const classes =
    tone === "good"
      ? "bg-emerald-500/15 text-emerald-300"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-white/10 text-white/65";

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${classes}`}>{label}</span>;
}

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: TemplatesPageSearchParams;
}) {
  const admin = await requireAdminWithPermission("templates.view");
  const params = await searchParams;
  const q = firstParam(params.q);
  const status = normalizeAdminTemplateStatus(firstParam(params.status));
  const type = normalizeAdminTemplateType(firstParam(params.type));
  const visibility = normalizeAdminTemplateVisibility(firstParam(params.visibility));
  const category = normalizeAdminTemplateCategory(firstParam(params.category));
  const guidedLevel = normalizeAdminTemplateGuidedLevel(firstParam(params.guidedLevel));
  const compatibility = normalizeAdminTemplateCompatibilityFilter(firstParam(params.compatibility));
  const page = Math.max(1, Number(firstParam(params.page) ?? 1));
  const result = await listAdminTemplates({
    q,
    status,
    type,
    visibility,
    category,
    guidedLevel,
    compatibility,
    page,
    pageSize: 25,
  });
  const canManage = hasPermission(admin.role, "templates.manage");
  const canReorder = hasPermission(admin.role, "templates.reorder");

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_templates_viewed",
    resourceType: "template_catalog",
    resourceId: "list",
    action: "view",
    metadataJson: {
      q,
      status,
      type,
      visibility,
      category,
      guidedLevel,
      compatibility,
      total: result.pagination.total,
    },
  });

  const totalPages = Math.max(1, Math.ceil(result.pagination.total / result.pagination.pageSize));
  const baseQuery = new URLSearchParams();
  if (q) baseQuery.set("q", q);
  if (status) baseQuery.set("status", status);
  if (type) baseQuery.set("type", type);
  if (visibility) baseQuery.set("visibility", visibility);
  if (category) baseQuery.set("category", category);
  if (guidedLevel) baseQuery.set("guidedLevel", guidedLevel);
  if (compatibility) baseQuery.set("compatibility", compatibility);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Templates</h1>
          <p className="mt-1 text-sm text-white/50">
            Manage the template catalog, metadata, defaults, ordering, and compatibility posture.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/admin/templates/new"
            className="inline-flex items-center justify-center rounded-lg bg-white/[0.08] px-4 py-2 text-sm text-white transition hover:bg-white/[0.14]"
          >
            New template
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Total templates</p>
          <p className="mt-3 text-3xl font-semibold text-white">{result.summary.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Published</p>
          <p className="mt-3 text-3xl font-semibold text-white">{result.summary.published}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Disabled</p>
          <p className="mt-3 text-3xl font-semibold text-white">{result.summary.disabled}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">In use</p>
          <p className="mt-3 text-3xl font-semibold text-white">{result.summary.inUse}</p>
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, id, or subtitle"
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 md:col-span-2 xl:col-span-2"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="disabled">Disabled</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All types</option>
          {ADMIN_TEMPLATE_TYPES.map((item) => (
            <option key={item} value={item}>
              {formatAdminTemplateEnumLabel(item)}
            </option>
          ))}
        </select>
        <select
          name="visibility"
          defaultValue={visibility ?? ""}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All visibility states</option>
          {ADMIN_TEMPLATE_VISIBILITIES.map((item) => (
            <option key={item} value={item}>
              {formatAdminTemplateEnumLabel(item)}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All categories</option>
          {ADMIN_TEMPLATE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {formatAdminTemplateEnumLabel(item)}
            </option>
          ))}
        </select>
        <select
          name="guidedLevel"
          defaultValue={guidedLevel ?? ""}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All guided levels</option>
          {ADMIN_TEMPLATE_GUIDED_LEVELS.map((item) => (
            <option key={item} value={item}>
              {formatAdminTemplateEnumLabel(item)}
            </option>
          ))}
        </select>
        <select
          name="compatibility"
          defaultValue={compatibility ?? ""}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All compatibility states</option>
          {ADMIN_TEMPLATE_COMPATIBILITY_FILTERS.map((item) => (
            <option key={item} value={item}>
              {formatAdminTemplateEnumLabel(item)}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14]"
          >
            Apply filters
          </button>
          <Link
            href="/admin/templates"
            className="rounded-lg px-3 py-2 text-sm text-white/50 transition hover:bg-white/[0.05] hover:text-white/80"
          >
            Reset
          </Link>
        </div>
      </form>

      {canReorder ? (
        <div className="mt-6">
          <TemplateOrderingManager
            items={result.items.map((item) => ({
              id: item.id,
              name: item.name,
              status: item.status,
              displayOrder: item.displayOrder,
              isDefault: item.isDefault,
            }))}
          />
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        {result.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/35">No templates matched these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/35">
                  <th className="px-2 py-2">Template</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Visibility</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Guided level</th>
                  <th className="px-2 py-2">Order</th>
                  <th className="px-2 py-2">Usage</th>
                  <th className="px-2 py-2">Structure</th>
                  <th className="px-2 py-2">Compatibility</th>
                  <th className="px-2 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((template) => (
                  <tr key={template.id} className="border-b border-white/5 align-top">
                    <td className="px-2 py-3">
                      <Link
                        href={`/admin/templates/${encodeURIComponent(template.id)}`}
                        className="font-medium text-white/80 hover:text-white"
                      >
                        {template.name}
                      </Link>
                      <p className="mt-1 text-xs text-white/40">{template.description ?? "No description"}</p>
                      <p className="mt-1 font-mono text-[11px] text-white/30">{template.id}</p>
                    </td>
                    <td className="px-2 py-3">
                      <Badge
                        label={formatAdminTemplateEnumLabel(template.status)}
                        tone={
                          template.status === "published"
                            ? "good"
                            : template.status === "disabled"
                              ? "warning"
                              : "neutral"
                        }
                      />
                    </td>
                    <td className="px-2 py-3 text-white/60">{formatAdminTemplateEnumLabel(template.type)}</td>
                    <td className="px-2 py-3">
                      <Badge label={formatAdminTemplateEnumLabel(template.visibility)} />
                    </td>
                    <td className="px-2 py-3 text-white/60">{formatAdminTemplateEnumLabel(template.category)}</td>
                    <td className="px-2 py-3 text-white/60">{formatAdminTemplateEnumLabel(template.guidedLevel)}</td>
                    <td className="px-2 py-3 text-white/60">
                      {template.displayOrder ?? "-"}
                      {template.isDefault ? <span className="mt-1 block text-xs text-emerald-300">Default</span> : null}
                    </td>
                    <td className="px-2 py-3 text-white/60">{template.usageCount} storybooks</td>
                    <td className="px-2 py-3 text-white/60">
                      {template.chapterCount} chapters | {template.questionCount} prompts
                    </td>
                    <td className="px-2 py-3 text-white/60">
                      {template.compatibilityStatus === "configured" ? "Configured" : "Needs attention"}
                    </td>
                    <td className="px-2 py-3 text-white/45">
                      {template.updatedAt > 0 ? new Date(template.updatedAt).toLocaleString("en-GB") : "Seeded"}
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
            {page > 1 ? (
              <Link
                href={`/admin/templates?${new URLSearchParams({ ...Object.fromEntries(baseQuery), page: String(page - 1) }).toString()}`}
                className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 transition hover:bg-white/[0.08] hover:text-white"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/30">Previous</span>
            )}
            {page < totalPages ? (
              <Link
                href={`/admin/templates?${new URLSearchParams({ ...Object.fromEntries(baseQuery), page: String(page + 1) }).toString()}`}
                className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 transition hover:bg-white/[0.08] hover:text-white"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/30">Next</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
