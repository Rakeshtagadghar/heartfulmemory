"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BillingEntitlements } from "../../../../packages/shared/billing/entitlements";

type BillingEntitlementsResponse = {
  entitlements: BillingEntitlements;
  subscription: {
    planId: string;
    status: string;
    stripeSubscriptionId: string;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

type UseEntitlementsOptions = {
  initialData?: BillingEntitlementsResponse | null;
  enabled?: boolean;
  pollIntervalMs?: number;
};

export function useEntitlements(options?: UseEntitlementsOptions) {
  const [data, setData] = useState<BillingEntitlementsResponse | null>(options?.initialData ?? null);
  const [loading, setLoading] = useState(!options?.initialData);
  const [error, setError] = useState<string | null>(null);
  const enabled = options?.enabled ?? true;
  const pollIntervalMs = options?.pollIntervalMs ?? 0;

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    let response: Response;
    try {
      response = await fetch("/api/billing/entitlements", {
        method: "GET",
        cache: "no-store"
      });
    } catch {
      setError("Unable to load entitlements.");
      setLoading(false);
      return;
    }

    const body = (await response.json().catch(() => null)) as
      | { ok: true; data: BillingEntitlementsResponse }
      | { ok?: false; error?: string }
      | null;
    if (!response.ok || !body || body.ok !== true) {
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        setError(body.error);
      } else {
        setError("Unable to load entitlements.");
      }
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

  const entitlements = useMemo(() => data?.entitlements ?? null, [data]);

  return {
    entitlements,
    subscription: data?.subscription ?? null,
    loading,
    error,
    refresh
  };
}
