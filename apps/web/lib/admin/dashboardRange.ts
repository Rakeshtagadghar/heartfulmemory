import {
  ADMIN_DASHBOARD_RANGE_PRESETS,
  type AdminDashboardRangePreset,
} from "../../../../packages/shared/admin/dashboard";

export interface AdminDashboardRange {
  preset: AdminDashboardRangePreset;
  dateFrom: number;
  dateTo: number;
  previousDateFrom: number;
  previousDateTo: number;
  label: string;
}

function startOfUtcDay(input: Date) {
  return Date.UTC(
    input.getUTCFullYear(),
    input.getUTCMonth(),
    input.getUTCDate(),
    0,
    0,
    0,
    0
  );
}

function endOfUtcDay(input: Date) {
  return Date.UTC(
    input.getUTCFullYear(),
    input.getUTCMonth(),
    input.getUTCDate(),
    23,
    59,
    59,
    999
  );
}

function parseDateOnly(input: string | null | undefined) {
  if (!input) return null;
  const value = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function normalizeDashboardRangePreset(
  value: string | null | undefined
): AdminDashboardRangePreset {
  return (ADMIN_DASHBOARD_RANGE_PRESETS as readonly string[]).includes(value ?? "")
    ? (value as AdminDashboardRangePreset)
    : "30d";
}

export function resolveAdminDashboardRange(input: {
  preset?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  nowMs?: number;
}): AdminDashboardRange {
  const nowMs = input.nowMs ?? Date.now();
  const now = new Date(nowMs);
  let preset = normalizeDashboardRangePreset(input.preset);
  const dayMs = 24 * 60 * 60 * 1000;

  let dateFrom: number;
  let dateTo: number;
  let label: string;

  if (preset === "today") {
    dateFrom = startOfUtcDay(now);
    dateTo = nowMs;
    label = "Today";
  } else if (preset === "7d") {
    dateTo = nowMs;
    dateFrom = nowMs - 7 * dayMs;
    label = "Last 7 days";
  } else if (preset === "custom") {
    const parsedFrom = parseDateOnly(input.dateFrom);
    const parsedTo = parseDateOnly(input.dateTo);
    if (!parsedFrom || !parsedTo || parsedFrom.getTime() > parsedTo.getTime()) {
      preset = "30d";
      dateTo = nowMs;
      dateFrom = nowMs - 30 * dayMs;
      label = "Last 30 days";
    } else {
      dateFrom = startOfUtcDay(parsedFrom);
      dateTo = Math.min(endOfUtcDay(parsedTo), nowMs);
      label = `${formatDateLabel(dateFrom)} to ${formatDateLabel(dateTo)}`;
    }
  } else {
    dateTo = nowMs;
    dateFrom = nowMs - 30 * dayMs;
    label = "Last 30 days";
  }

  const durationMs = Math.max(dayMs, dateTo - dateFrom + 1);

  return {
    preset,
    dateFrom,
    dateTo,
    previousDateFrom: dateFrom - durationMs,
    previousDateTo: dateFrom - 1,
    label,
  };
}
