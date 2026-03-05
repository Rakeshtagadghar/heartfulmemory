"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
    cancelAt: number | null;
    canceledAt: number | null;
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

// ── Module-level shared cache ──────────────────────────────────────
// Multiple hook instances (EditorShell + app-shell) share the same
// cached response and deduplicate in-flight requests.
let _cached: PlanStatusResponse | null = null;
let _cachedAt = 0;
let _inflight: Promise<PlanStatusResponse | null> | null = null;
const STALE_MS = 10_000;

async function _fetchPlanStatus(): Promise<PlanStatusResponse | null> {
  const response = await fetch("/api/billing/plan-status", {
    method: "GET",
    cache: "no-store"
  });
  const body = (await response.json().catch(() => null)) as
    | { ok: true; data: PlanStatusResponse }
    | { ok?: false; error?: string }
    | null;
  if (!response.ok || body?.ok !== true) return null;
  return body.data;
}

async function getPlanStatusDeduped(
  force = false
): Promise<{ data: PlanStatusResponse | null; error: string | null }> {
  if (!force && _cached && Date.now() - _cachedAt < STALE_MS) {
    return { data: _cached, error: null };
  }
  // Deduplicate concurrent requests
  if (_inflight) {
    const data = await _inflight;
    return { data, error: data ? null : "Unable to load plan status." };
  }
  _inflight = _fetchPlanStatus();
  try {
    const data = await _inflight;
    if (data) {
      _cached = data;
      _cachedAt = Date.now();
    }
    return { data, error: data ? null : "Unable to load plan status." };
  } finally {
    _inflight = null;
  }
}

export function usePlanStatus(options?: UsePlanStatusOptions) {
  const enabled = options?.enabled ?? true;
  const pollIntervalMs = options?.pollIntervalMs ?? 15000;
  const [data, setData] = useState<PlanStatusResponse | null>(_cached);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const result = await getPlanStatusDeduped(true);
    if (!mountedRef.current) return;
    setData(result.data);
    setError(result.error);
    setLoading(false);
  }, [enabled]);

  // Initial fetch — once on mount, uses cache if fresh
  useEffect(() => {
    if (!enabled) return;
    void getPlanStatusDeduped().then((result) => {
      if (!mountedRef.current) return;
      setData(result.data);
      setError(result.error);
      setLoading(false);
    });
  }, [enabled]);

  // Poll at interval — skip when tab is hidden
  useEffect(() => {
    if (!enabled || pollIntervalMs <= 0) return;
    const interval = globalThis.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void getPlanStatusDeduped(true).then((result) => {
        if (!mountedRef.current) return;
        setData(result.data);
        setError(result.error);
      });
    }, pollIntervalMs);
    return () => { globalThis.clearInterval(interval); };
  }, [enabled, pollIntervalMs]);

  const planId = useMemo(() => data?.entitlements.planId ?? "free", [data]);

  return {
    planId,
    data,
    loading,
    error,
    refresh
  };
}

