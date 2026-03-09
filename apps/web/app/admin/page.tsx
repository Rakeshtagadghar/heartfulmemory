import Link from "next/link";
import type { ReactNode } from "react";
import { hasPermission } from "../../../../packages/shared/admin/rbac";
import type {
  AdminDashboardAlertItem,
  AdminDashboardBreakdownItem,
  AdminDashboardFunnelSummary,
  AdminDashboardKpiMetric,
  AdminDashboardRecentErrorsSummary,
} from "../../../../packages/shared/admin/dashboard";
import { getAdminDashboardSummary, writeAuditLog } from "../../lib/admin/adminOps";
import { requireAdminWithPermission } from "../../lib/admin/requireAdmin";

type DashboardSearchParams = Promise<{
  rangePreset?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
}>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function formatMetricValue(metric: AdminDashboardKpiMetric) {
  if (metric.unit === "percentage") {
    return `${metric.value.toFixed(1)}%`;
  }
  return new Intl.NumberFormat("en-GB").format(metric.value);
}

function formatSecondaryValue(metric: AdminDashboardKpiMetric) {
  if (metric.secondaryValue === null || !metric.secondaryLabel) return null;
  const value =
    metric.unit === "percentage" && metric.secondaryLabel.toLowerCase().includes("rate")
      ? `${metric.secondaryValue}%`
      : new Intl.NumberFormat("en-GB").format(metric.secondaryValue);
  return `${value} ${metric.secondaryLabel}`;
}

function formatDelta(metric: AdminDashboardKpiMetric) {
  if (metric.delta === null || !metric.deltaLabel) return null;
  const sign = metric.delta > 0 ? "+" : "";
  const value =
    metric.unit === "percentage"
      ? `${sign}${metric.delta.toFixed(1)} pts`
      : `${sign}${new Intl.NumberFormat("en-GB").format(metric.delta)}`;

  return `${value} ${metric.deltaLabel}`;
}

function formatDateTime(value: number) {
  return new Date(value).toLocaleString("en-GB");
}

function formatDateInput(value: string) {
  return value.slice(0, 10);
}

function formatBreakdownLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function levelClasses(level: AdminDashboardAlertItem["level"]) {
  if (level === "critical") return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  if (level === "warning") return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  return "border-sky-500/20 bg-sky-500/10 text-sky-200";
}

function getSeriesColor(index: number) {
  const colors = [
    "#7dd3fc",
    "#34d399",
    "#fbbf24",
    "#fb7185",
    "#a78bfa",
    "#60a5fa",
  ];
  return colors[index % colors.length] ?? "#7dd3fc";
}

function buildSparklinePath(values: number[], width: number, height: number) {
  const safeValues = values.map((value) => (Number.isFinite(value) ? value : 0));
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = Math.max(max - min, 1);

  return safeValues
    .map((value, index) => {
      const x = (index / Math.max(safeValues.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function MiniSparkline({ metric }: { metric: AdminDashboardKpiMetric }) {
  const previousValue = metric.delta === null ? metric.value : Math.max(metric.value - metric.delta, 0);
  const middleValue = metric.secondaryValue ?? Math.max(metric.value * 0.7, 0);
  const values = [previousValue, middleValue, metric.value];
  const path = buildSparklinePath(values, 100, 42);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <svg viewBox="0 0 100 42" className="h-12 w-full overflow-visible">
        <defs>
          <linearGradient id="kpi-sparkline-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.35)" />
            <stop offset="100%" stopColor="rgba(125, 211, 252, 0.02)" />
          </linearGradient>
        </defs>
        <path d={`${path} L 100 42 L 0 42 Z`} fill="url(#kpi-sparkline-fill)" />
        <path d={path} fill="none" stroke="#7dd3fc" strokeWidth="2.25" strokeLinecap="round" />
        {values.map((value, index) => {
          const x = (index / Math.max(values.length - 1, 1)) * 100;
          const max = Math.max(...values, 1);
          const min = Math.min(...values, 0);
          const range = Math.max(max - min, 1);
          const y = 42 - ((value - min) / range) * 42;
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.5" fill="#e0f2fe" />;
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/30">
        <span>Prev</span>
        <span>Selected range</span>
      </div>
    </div>
  );
}

function DonutChart({ items }: { items: AdminDashboardBreakdownItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total <= 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-[1.75rem] border border-white/8 bg-white/[0.02] text-sm text-white/35">
        No chart data
      </div>
    );
  }

  let offset = 0;
  const segments = items.map((item, index) => {
    const dash = (item.count / total) * 282.6;
    const segment = {
      id: item.id,
      color: getSeriesColor(index),
      dash,
      offset,
    };
    offset += dash;
    return segment;
  });

  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
            <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
            {segments.map((segment) => (
              <circle
                key={segment.id}
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke={segment.color}
                strokeWidth="14"
                strokeDasharray={`${segment.dash} 282.6`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">Total</p>
            <p className="mt-1 text-2xl font-semibold text-white">{total}</p>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {items.slice(0, 4).map((item, index) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getSeriesColor(index) }}
                />
                <span className="truncate text-white/65">{formatBreakdownLabel(item.label)}</span>
              </div>
              <span className="shrink-0 text-white/45">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FunnelOverviewChart({ funnel }: { funnel: AdminDashboardFunnelSummary }) {
  const maxCount = Math.max(...funnel.stages.map((stage) => stage.count), 1);

  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-4">
      <div className="flex h-44 items-end gap-2">
        {funnel.stages.map((stage, index) => {
          const height = `${Math.max((stage.count / maxCount) * 100, 12)}%`;
          const isLargestDropoff = funnel.largestDropoffStageId === stage.id;

          return (
            <div key={stage.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="text-[11px] text-white/35">
                {stage.conversionFromPrevious === null ? "100%" : `${stage.conversionFromPrevious.toFixed(0)}%`}
              </div>
              <div className="flex h-full w-full items-end">
                <div
                  className={`w-full rounded-t-2xl border border-b-0 ${
                    isLargestDropoff
                      ? "border-amber-400/35 bg-gradient-to-t from-amber-500/15 to-amber-300/70"
                      : "border-cyan-300/20 bg-gradient-to-t from-cyan-500/10 to-cyan-300/70"
                  }`}
                  style={{ height }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">{stage.count}</p>
                <p className="line-clamp-2 text-[11px] text-white/35">{stage.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function resolveAlertHref(
  href: string | null,
  input: { canViewUsers: boolean; canViewExports: boolean }
) {
  if (!href) return null;
  if (href.startsWith("/admin/users")) return input.canViewUsers ? href : null;
  if (href.startsWith("/admin/exports")) return input.canViewExports ? href : null;
  return null;
}

function WidgetShell({
  title,
  description,
  href,
  actionLabel = "Open",
  children,
}: {
  title: string;
  description?: string;
  href?: string | null;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-white/85">{title}</h2>
          {description ? <p className="mt-1 text-sm text-white/45">{description}</p> : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 whitespace-nowrap text-right text-xs leading-tight text-white/45 transition hover:text-white/80"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function KpiCard({
  title,
  metric,
  href,
}: {
  title: string;
  metric: AdminDashboardKpiMetric;
  href?: string | null;
}) {
  const delta = formatDelta(metric);
  const secondary = formatSecondaryValue(metric);

  return (
    <WidgetShell title={title} href={href} actionLabel="Inspect">
      <div className="grid gap-4 lg:grid-cols-[1fr_132px] lg:items-end">
        <div>
          <p className="text-3xl font-semibold text-white">{formatMetricValue(metric)}</p>
          {secondary ? <p className="mt-2 text-sm text-white/55">{secondary}</p> : null}
          {delta ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">{delta}</p> : null}
        </div>
        <MiniSparkline metric={metric} />
      </div>
    </WidgetShell>
  );
}

function BreakdownCard({
  title,
  description,
  items,
  href,
}: {
  title: string;
  description?: string;
  items: AdminDashboardBreakdownItem[];
  href?: string | null;
}) {
  return (
    <WidgetShell title={title} description={description} href={href} actionLabel="Inspect">
      {items.length === 0 ? (
        <p className="text-sm text-white/40">No data is available for this widget yet.</p>
      ) : (
        <div className="space-y-4">
          <DonutChart items={items} />
          {items.map((item, index) => (
            <div key={item.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getSeriesColor(index) }}
                  />
                  <span className="truncate text-white/65">{formatBreakdownLabel(item.label)}</span>
                </div>
                <span className="shrink-0 text-white/45">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: getSeriesColor(index),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function FunnelCard({
  funnel,
  href,
}: {
  funnel: AdminDashboardFunnelSummary;
  href?: string | null;
}) {
  return (
    <WidgetShell
      title="Conversion Funnel Snapshot"
      description="Inferred from waitlist, signup, activity, project creation, and successful export events."
      href={href}
      actionLabel="Inspect"
    >
      {!funnel.available ? (
        <p className="text-sm text-white/40">{funnel.reason ?? "Funnel data is unavailable."}</p>
      ) : (
        <div className="space-y-4">
          <FunnelOverviewChart funnel={funnel} />
          {funnel.stages.map((stage, index) => {
            const maxCount = Math.max(funnel.stages[0]?.count ?? 1, 1);
            const isLargestDropoff = funnel.largestDropoffStageId === stage.id;
            return (
              <div
                key={stage.id}
                className={`rounded-xl border p-3 ${
                  isLargestDropoff ? "border-amber-500/25 bg-amber-500/10" : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-white/35">Step {index + 1}</p>
                    <p className="mt-1 text-sm text-white/80">{stage.label}</p>
                  </div>
                  <p className="text-lg font-semibold text-white">{stage.count}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${isLargestDropoff ? "bg-amber-300/80" : "bg-emerald-300/75"}`}
                    style={{ width: `${Math.min((stage.count / maxCount) * 100, 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/45">
                  <span>
                    Conversion:{" "}
                    {stage.conversionFromPrevious === null
                      ? "-"
                      : `${stage.conversionFromPrevious.toFixed(1)}%`}
                  </span>
                  <span>
                    Drop-off:{" "}
                    {stage.dropFromPrevious === null ? "-" : new Intl.NumberFormat("en-GB").format(stage.dropFromPrevious)}
                  </span>
                  {isLargestDropoff ? <span className="text-amber-200">Largest drop-off</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}

function ErrorsCard({ errors }: { errors: AdminDashboardRecentErrorsSummary }) {
  return (
    <WidgetShell
      title="Recent Errors"
      description="Application stability summary for the selected range."
    >
      {!errors.available ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-sm text-white/75">Unavailable</p>
          <p className="mt-2 text-sm text-white/45">
            {errors.reason ?? "Application error aggregation is not configured yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Recent errors</p>
              <p className="mt-2 text-2xl font-semibold text-white">{errors.count}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Affected users</p>
              <p className="mt-2 text-2xl font-semibold text-white">{errors.affectedUsers ?? "-"}</p>
            </div>
          </div>
          {errors.topCategories.length > 0 ? (
            <div className="space-y-2">
              {errors.topCategories.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm text-white/60">
                  <span>{formatBreakdownLabel(item.category)}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </WidgetShell>
  );
}

function EmptyList({ message }: { message: string }) {
  return <p className="text-sm text-white/40">{message}</p>;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const admin = await requireAdminWithPermission("dashboard.view");
  const params = await searchParams;
  const rangePreset = firstParam(params.rangePreset);
  const dateFrom = firstParam(params.dateFrom);
  const dateTo = firstParam(params.dateTo);
  const summary = await getAdminDashboardSummary({
    preset: rangePreset,
    dateFrom,
    dateTo,
    includeBillingSnapshot: hasPermission(admin.role, "billing.view"),
  });

  if (!summary) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-white/50">
          The operational summary is temporarily unavailable.
        </p>
        <div className="mt-4">
          <Link href="/admin" className="text-sm text-white/65 hover:text-white">
            Retry
          </Link>
        </div>
      </div>
    );
  }

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_dashboard_viewed",
    resourceType: "dashboard",
    resourceId: "summary",
    action: "view",
    metadataJson: {
      rangePreset: summary.range.preset,
      dateFrom: summary.range.dateFrom,
      dateTo: summary.range.dateTo,
      billingSnapshotVisible: hasPermission(admin.role, "billing.view"),
    },
  });

  const canViewUsers = hasPermission(admin.role, "users.view");
  const canViewExports = hasPermission(admin.role, "exports.view");
  const canViewBilling = hasPermission(admin.role, "billing.view");
  const canViewProjects = hasPermission(admin.role, "projects.view");

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">
            Platform health across growth, engagement, exports, and operational issues.
          </p>
        </div>
        <div className="text-sm text-white/45">
          <p>{summary.range.label}</p>
          <p className="mt-1">Last updated {formatDateTime(summary.lastUpdatedAt)}</p>
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
        <select
          name="rangePreset"
          defaultValue={summary.range.preset}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="custom">Custom range</option>
        </select>
        <input
          type="date"
          name="dateFrom"
          defaultValue={dateFrom ?? formatDateInput(summary.range.dateFrom)}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        />
        <input
          type="date"
          name="dateTo"
          defaultValue={dateTo ?? formatDateInput(summary.range.dateTo)}
          className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14]"
          >
            Apply range
          </button>
          <Link
            href="/admin"
            className="rounded-lg px-3 py-2 text-sm text-white/50 transition hover:bg-white/[0.05] hover:text-white/80"
          >
            Reset
          </Link>
        </div>
        <p className="md:col-span-4 text-xs text-white/35">
          Custom dates are used only when the preset is set to Custom range.
        </p>
      </form>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        {canViewUsers ? (
          <>
            <KpiCard title="Total Users" metric={summary.kpis.totalUsers} href="/admin/users" />
            <KpiCard
              title="Active Users"
              metric={summary.kpis.activeUsers}
              href="/admin/users?filter=active"
            />
          </>
        ) : null}
        <KpiCard title="Books Created" metric={summary.kpis.booksCreated} />
        {canViewExports ? (
          <KpiCard
            title="Export Success Rate"
            metric={summary.kpis.exportSuccessRate}
            href="/admin/exports"
          />
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <FunnelCard funnel={summary.funnel} />
        <ErrorsCard errors={summary.recentErrors} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <BreakdownCard
          title="Book Status Breakdown"
          description="How current storybooks are distributed across lifecycle states."
          items={summary.bookStatusBreakdown.items}
        />
        {canViewExports ? (
          <BreakdownCard
            title="Export Jobs Breakdown"
            description="Completed and in-flight export work in the selected range."
            items={summary.exportStatusBreakdown.items}
            href="/admin/exports"
          />
        ) : null}
        {canViewBilling && summary.billingPlanSnapshot ? (
          <BreakdownCard
            title="Billing Plan Snapshot"
            description="Current user distribution across free, trial, paid, and manual states."
            items={summary.billingPlanSnapshot.items}
          />
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        {canViewUsers ? (
          <WidgetShell
            title="Recent Signups"
            description="Newest user accounts in the selected range."
            href="/admin/users"
            actionLabel="View users"
          >
            {summary.recentSignups.items.length === 0 ? (
              <EmptyList message="No signups landed in this range." />
            ) : (
              <div className="space-y-3">
                {summary.recentSignups.items.map((item) => (
                  <div key={item.userId} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/80">{item.displayName ?? "Unnamed user"}</p>
                        <p className="mt-1 break-all text-xs text-white/45">{item.email ?? item.userId}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">
                        {item.planLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span>{item.onboardingStatus.replaceAll("_", " ")}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                    {item.href ? (
                      <div className="mt-3">
                        <Link href={item.href} className="text-xs text-white/60 hover:text-white">
                          Open user
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </WidgetShell>
        ) : null}

        {canViewExports ? (
          <WidgetShell
            title="Recent Failed Exports"
            description="Most recent export failures that may need investigation."
            href="/admin/exports?status=failed"
            actionLabel="View failures"
          >
            {summary.recentFailedExports.items.length === 0 ? (
              <EmptyList message="No failed exports landed in this range." />
            ) : (
              <div className="space-y-3">
                {summary.recentFailedExports.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm text-white/80">
                          {canViewProjects ? (
                            <Link
                              href={`/admin/projects/${encodeURIComponent(item.projectId)}`}
                              className="hover:text-white"
                            >
                              {item.projectTitle}
                            </Link>
                          ) : (
                            item.projectTitle
                          )}
                        </p>
                        <p className="mt-1 break-all text-xs text-white/45">
                          {item.ownerDisplayName ?? "User"}
                          {item.ownerEmail ? ` | ${item.ownerEmail}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] text-rose-200">
                        {formatBreakdownLabel(item.failureCategory ?? "unknown_error")}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="break-all font-mono">{item.id}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                    {item.href ? (
                      <div className="mt-3">
                        <Link href={item.href} className="text-xs text-white/60 hover:text-white">
                          Open export
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </WidgetShell>
        ) : null}

        <WidgetShell
          title="Recent Alerts"
          description="Short operational signals generated from current dashboard conditions."
        >
          {summary.recentAlerts.items.length === 0 ? (
            <EmptyList message="No operational alerts are active for this range." />
          ) : (
            <div className="space-y-3">
              {summary.recentAlerts.items.map((item) => {
                const alertHref = resolveAlertHref(item.href, { canViewUsers, canViewExports });

                return (
                  <div key={item.id} className={`rounded-xl border p-3 ${levelClasses(item.level)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-1 text-sm opacity-80">{item.message}</p>
                      </div>
                      <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] opacity-70">
                        {item.level}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-xs opacity-70 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span>{formatDateTime(item.occurredAt)}</span>
                      {alertHref ? (
                        <Link href={alertHref} className="opacity-80 transition hover:opacity-100">
                          Inspect
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </WidgetShell>
      </div>
    </div>
  );
}
