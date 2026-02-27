export type QuotaStatusInput = {
  remaining: number | null;
  used?: number | null;
  limit?: number | null;
};

export type QuotaPeriodInput = {
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodStart?: number | null;
  subscriptionCurrentPeriodEnd?: number | null;
  nowMs?: number;
};

export type QuotaPeriod = {
  periodStart: number;
  periodEnd: number;
  periodSource: "subscription" | "calendar";
};

function startOfCurrentMonth(nowMs: number) {
  const date = new Date(nowMs);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0);
}

function startOfNextMonth(nowMs: number) {
  const date = new Date(nowMs);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0);
}

function isExportEligibleSubscriptionStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

export function resolveQuotaPeriod(input: QuotaPeriodInput): QuotaPeriod {
  const nowMs = input.nowMs ?? Date.now();
  const start = input.subscriptionCurrentPeriodStart;
  const end = input.subscriptionCurrentPeriodEnd;

  if (
    isExportEligibleSubscriptionStatus(input.subscriptionStatus) &&
    typeof start === "number" &&
    typeof end === "number" &&
    end > start
  ) {
    return {
      periodStart: start,
      periodEnd: end,
      periodSource: "subscription"
    };
  }

  return {
    periodStart: startOfCurrentMonth(nowMs),
    periodEnd: startOfNextMonth(nowMs),
    periodSource: "calendar"
  };
}

export function isQuotaExceeded(input: QuotaStatusInput) {
  return typeof input.remaining === "number" && input.remaining <= 0;
}

export function formatQuotaSummary(input: QuotaStatusInput) {
  if (typeof input.remaining !== "number") return "Unlimited exports";
  if (typeof input.used === "number" && typeof input.limit === "number") {
    return `${Math.max(0, input.limit - input.used)}/${input.limit} exports left this month`;
  }
  return `${Math.max(0, input.remaining)} exports left this month`;
}
