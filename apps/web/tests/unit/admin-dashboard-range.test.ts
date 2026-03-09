import { describe, expect, it } from "vitest";
import {
  normalizeDashboardRangePreset,
  resolveAdminDashboardRange,
} from "../../lib/admin/dashboardRange";

describe("normalizeDashboardRangePreset", () => {
  it("falls back to 30d for unknown presets", () => {
    expect(normalizeDashboardRangePreset("invalid")).toBe("30d");
    expect(normalizeDashboardRangePreset(null)).toBe("30d");
  });
});

describe("resolveAdminDashboardRange", () => {
  const nowMs = Date.UTC(2026, 2, 9, 15, 30, 0, 0);

  it("builds a today range with a previous non-overlapping window", () => {
    const range = resolveAdminDashboardRange({ preset: "today", nowMs });

    expect(range.preset).toBe("today");
    expect(range.dateFrom).toBe(Date.UTC(2026, 2, 9, 0, 0, 0, 0));
    expect(range.dateTo).toBe(nowMs);
    expect(range.previousDateTo).toBe(range.dateFrom - 1);
    expect(range.previousDateFrom).toBeLessThan(range.dateFrom);
  });

  it("builds a valid custom range", () => {
    const range = resolveAdminDashboardRange({
      preset: "custom",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-10",
      nowMs,
    });

    expect(range.preset).toBe("custom");
    expect(range.dateFrom).toBe(Date.UTC(2026, 1, 1, 0, 0, 0, 0));
    expect(range.dateTo).toBe(Date.UTC(2026, 1, 10, 23, 59, 59, 999));
    expect(range.previousDateTo).toBe(range.dateFrom - 1);
    expect(range.label).toContain("2026");
  });

  it("falls back to 30d when custom dates are invalid", () => {
    const range = resolveAdminDashboardRange({
      preset: "custom",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-01",
      nowMs,
    });

    expect(range.preset).toBe("30d");
    expect(range.label).toBe("Last 30 days");
    expect(range.dateTo).toBe(nowMs);
    expect(range.previousDateTo).toBe(range.dateFrom - 1);
  });
});
