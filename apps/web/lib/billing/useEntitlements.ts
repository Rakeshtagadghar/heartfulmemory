"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BillingEntitlements } from "../../../../packages/shared/billing/entitlements";

type BillingEntitlementsResponse = {
  entitlements: BillingEntitlements;
  subscription: {
    planId: string;
    status: string;
    stripeSubscriptionId: string;
    currentPeriodStart: number | null;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage?: {
    used: number;
    periodStart: number;
    periodEnd: number;
    periodSource: "subscription" | "calendar";
  };
};

type UseEntitlementsOptions = {
  initialData?: BillingEntitlementsResponse | null;
  enabled?: boolean;
  pollIntervalMs?: number;
};

type RefreshOptions = {
  background?: boolean;
};

export function useEntitlements(options?: UseEntitlementsOptions) {
  const [data, setData] = useState<BillingEntitlementsResponse | null>(options?.initialData ?? null);
  const [loading, setLoading] = useState(!options?.initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = options?.enabled ?? true;
  const pollIntervalMs = options?.pollIntervalMs ?? 0;
  const requestIdRef = useRef(0);
  const hasDataRef = useRef(Boolean(options?.initialData));

  useEffect(() => {
    hasDataRef.current = Boolean(data);
  }, [data]);

  const refresh = useCallback(async (refreshOptions?: RefreshOptions) => {
    if (!enabled) return;
    const background = refreshOptions?.background ?? false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (hasDataRef.current) {
      if (!background) {
        setRefreshing(true);
      }
    } else {
      setLoading(true);
    }
    if (!background) {
      setError(null);
    }

    let response: Response;
    try {
      response = await fetch("/api/billing/entitlements", {
        method: "GET",
        cache: "no-store"
      });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Unable to load entitlements.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const body = (await response.json().catch(() => null)) as
      | { ok: true; data: BillingEntitlementsResponse }
      | { ok?: false; error?: string }
      | null;
    if (requestId !== requestIdRef.current) return;
    if (!response.ok || !body || body.ok !== true) {
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        setError(body.error);
      } else {
        setError("Unable to load entitlements.");
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setData(body.data);
    hasDataRef.current = true;
    setLoading(false);
    setRefreshing(false);
    setError(null);
  }, [enabled]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void refresh({ background: Boolean(options?.initialData) });
    }, 0);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [options?.initialData, refresh]);

  useEffect(() => {
    if (!enabled || pollIntervalMs <= 0) return;
    const interval = globalThis.setInterval(() => {
      void refresh({ background: true });
    }, pollIntervalMs);
    return () => {
      globalThis.clearInterval(interval);
    };
  }, [enabled, pollIntervalMs, refresh]);

  const entitlements = useMemo(() => data?.entitlements ?? null, [data]);

  return {
    entitlements,
    subscription: data?.subscription ?? null,
    usage: data?.usage ?? null,
    loading,
    refreshing,
    error,
    refresh
  };
}
