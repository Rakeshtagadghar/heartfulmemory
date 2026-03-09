export const ADMIN_DASHBOARD_RANGE_PRESETS = ["today", "7d", "30d", "custom"] as const;
export type AdminDashboardRangePreset =
  (typeof ADMIN_DASHBOARD_RANGE_PRESETS)[number];

export interface AdminDashboardKpiMetric {
  value: number;
  unit: "count" | "percentage";
  delta: number | null;
  deltaLabel: string | null;
  secondaryValue: number | null;
  secondaryLabel: string | null;
}

export interface AdminDashboardFunnelStage {
  id: string;
  label: string;
  count: number;
  conversionFromPrevious: number | null;
  dropFromPrevious: number | null;
}

export interface AdminDashboardBreakdownItem {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface AdminDashboardTopCategory {
  category: string;
  count: number;
}

export interface AdminDashboardRecentErrorItem {
  id: string;
  category: string;
  label: string;
  message: string | null;
  userId: string | null;
  occurredAt: number;
  href: string | null;
}

export interface AdminDashboardRecentSignupItem {
  userId: string;
  displayName: string | null;
  email: string | null;
  createdAt: number;
  planLabel: string;
  onboardingStatus: "completed" | "incomplete";
  href: string | null;
}

export interface AdminDashboardRecentFailedExportItem {
  id: string;
  projectId: string;
  projectTitle: string;
  ownerId: string;
  ownerDisplayName: string | null;
  ownerEmail: string | null;
  failureCategory: string | null;
  createdAt: number;
  href: string | null;
}

export interface AdminDashboardAlertItem {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
  href: string | null;
  occurredAt: number;
}

export interface AdminDashboardRecentErrorsSummary {
  available: boolean;
  reason: string | null;
  count: number;
  affectedUsers: number | null;
  topCategories: AdminDashboardTopCategory[];
  latestItems: AdminDashboardRecentErrorItem[];
}

export interface AdminDashboardFunnelSummary {
  available: boolean;
  reason: string | null;
  stages: AdminDashboardFunnelStage[];
  largestDropoffStageId: string | null;
}

export type AdminDashboardBillingPlanSnapshot = {
  items: AdminDashboardBreakdownItem[];
} | null;

export interface AdminDashboardSummaryData {
  kpis: {
    totalUsers: AdminDashboardKpiMetric;
    activeUsers: AdminDashboardKpiMetric;
    booksCreated: AdminDashboardKpiMetric;
    exportSuccessRate: AdminDashboardKpiMetric;
  };
  funnel: AdminDashboardFunnelSummary;
  bookStatusBreakdown: {
    items: AdminDashboardBreakdownItem[];
  };
  exportStatusBreakdown: {
    items: AdminDashboardBreakdownItem[];
  };
  billingPlanSnapshot: AdminDashboardBillingPlanSnapshot;
  recentErrors: AdminDashboardRecentErrorsSummary;
  recentSignups: {
    items: AdminDashboardRecentSignupItem[];
  };
  recentFailedExports: {
    items: AdminDashboardRecentFailedExportItem[];
  };
  recentAlerts: {
    items: AdminDashboardAlertItem[];
  };
  lastUpdatedAt: number;
}

export interface AdminDashboardSummary extends AdminDashboardSummaryData {
  range: {
    preset: AdminDashboardRangePreset;
    dateFrom: string;
    dateTo: string;
    label: string;
  };
}

export function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function calculateDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return current - previous;
}

export function findLargestDropoffStageId(
  stages: Array<Pick<AdminDashboardFunnelStage, "id" | "count">>
): string | null {
  let largestDropoffId: string | null = null;
  let largestDropoffValue = 0;

  for (let index = 1; index < stages.length; index += 1) {
    const previous = stages[index - 1];
    const current = stages[index];
    const drop = previous.count - current.count;
    if (drop > largestDropoffValue) {
      largestDropoffValue = drop;
      largestDropoffId = current.id;
    }
  }

  return largestDropoffId;
}
