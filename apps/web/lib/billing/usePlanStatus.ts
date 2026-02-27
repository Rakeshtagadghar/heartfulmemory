"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type PlanStatusResponse = {
  billingMode: "test" | "live";
  entitlements: {
    planId: "free" | "pro";
    subscriptionStatus: "none" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
    canExportDigital: boolean;
    canExportHardcopy: boolean;
    exportsRemaining: number | null;
  };
  subscription: {
    stripeSubscriptionId: string;
    planId: string;
    status: string;
    currentPeriodStart: number | null;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: {
    used: number;
    periodStart: number;
    periodEnd: number;
    periodSource: "subscription" | "calendar";
  } | null;
  quota: {
    used: number;
    limit: number;
    remaining: number | null;
  };
};

type UsePlanStatusOptions = {
  enabled?: boolean;
  pollIntervalMs?: number;
};

export function usePlanStatus(options?: UsePlanStatusOptions) {
  const enabled = options?.enabled ?? true;
  const pollIntervalMs = options?.pollIntervalMs ?? 15000;
  const [data, setData] = useState<PlanStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setError(null);
    const response = await fetch("/api/billing/plan-status", {
      method: "GET",
      cache: "no-store"
    });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; data: PlanStatusResponse }
      | { ok?: false; error?: string }
      | null;
    if (!response.ok || !body || body.ok !== true) {
      setError(body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Unable to load plan status.");
      setLoading(false);
      return;
    }
    setData(body.data);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!enabled || pollIntervalMs <= 0) return;
    const interval = globalThis.setInterval(() => {
      void refresh();
    }, pollIntervalMs);
    return () => {
      globalThis.clearInterval(interval);
    };
  }, [enabled, pollIntervalMs, refresh]);

  const planId = useMemo(() => data?.entitlements.planId ?? "free", [data]);

  return {
    planId,
    data,
    loading,
    error,
    refresh
  };
}

