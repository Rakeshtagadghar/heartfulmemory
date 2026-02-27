"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useEntitlements } from "../../lib/billing/useEntitlements";
import { Button } from "../ui/button";

export function BillingSuccessState({
  returnTo
}: {
  returnTo: string;
}) {
  const { entitlements, subscription, loading, refreshing, error, refresh } = useEntitlements({ pollIntervalMs: 0 });
  const isChecking = loading || refreshing;
  const isActive = Boolean(entitlements?.canExportDigital);
  const planLabel = entitlements?.planId === "pro" ? "Pro" : "Free";
  const subscriptionStatusLabel = subscription?.status ? subscription.status.replaceAll("_", " ") : "pending";
  const exportsLabel =
    typeof entitlements?.exportsRemaining === "number"
      ? `${Math.max(0, entitlements.exportsRemaining)} exports left this month`
      : "Unlimited exports";
  const statusMessage = isActive
    ? "Your Pro plan is active. Export is now unlocked."
    : isChecking
      ? "We are confirming your subscription via webhook. This usually takes a few seconds."
      : error
        ? "We could not confirm activation right now. Please refresh status."
        : "Payment is successful. We are still waiting for webhook confirmation.";
  const step2State = isActive ? "done" : isChecking ? "active" : "pending";
  const step3State = isActive ? "done" : "pending";

  useEffect(() => {
    if (isActive) return;
    const interval = globalThis.setInterval(() => {
      void refresh({ background: true });
    }, 3000);
    return () => {
      globalThis.clearInterval(interval);
    };
  }, [isActive, refresh]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_15%_10%,rgba(213,179,106,0.12),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gold/80">Billing</p>
            <h1 className="mt-2 text-2xl font-semibold text-parchment">
              {isActive ? "You're all set" : "Payment received"}
            </h1>
            <p className="mt-3 text-sm text-white/75" aria-live="polite">
              {statusMessage}
            </p>
          </div>
          <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/35 bg-emerald-500/15 text-emerald-100">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m20 6-11 11-5-5" />
            </svg>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
          <p className="font-semibold text-white/85">Activation progress</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m20 6-11 11-5-5" />
                </svg>
              </span>
              <span>Payment captured</span>
            </div>
            <div className="flex items-center gap-2">
              {step2State === "done" ? (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </span>
              ) : step2State === "active" ? (
                <span className="inline-flex h-4 w-4 animate-pulse rounded-full border border-cyan-300/60 bg-cyan-500/20" />
              ) : (
                <span className="inline-flex h-4 w-4 rounded-full border border-white/20" />
              )}
              <span>Webhook confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              {step3State === "done" ? (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </span>
              ) : (
                <span className="inline-flex h-4 w-4 rounded-full border border-white/20" />
              )}
              <span>Export unlocked</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-white/50">Current status</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Plan</p>
            <p className="mt-1 text-sm font-semibold text-white">{planLabel}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Subscription</p>
            <p className="mt-1 text-sm font-semibold capitalize text-white">{subscriptionStatusLabel}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Quota</p>
            <p className="mt-1 text-sm font-semibold text-white">{exportsLabel}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={returnTo} className="inline-flex h-10 items-center rounded-xl border border-gold/65 bg-gold px-4 text-sm font-semibold text-ink hover:bg-[#e3c17b]">
          {isActive ? "Start exporting" : "Return to Studio"}
        </Link>
        <Link href="/app" className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-parchment hover:bg-white/10">
          Go to dashboard
        </Link>
        <Button type="button" variant="secondary" loading={isChecking} onClick={() => void refresh()}>
          Refresh status
        </Button>
        <Link href="/app/account/billing" className="text-sm text-gold hover:text-[#e8cc95]">
          Manage billing
        </Link>
      </div>

      {!isActive ? (
        <p className="text-xs text-white/55">
          Tip: this page auto-refreshes every few seconds while Stripe webhooks sync.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </p>
      ) : null}
      {!isActive && !isChecking ? (
        <p className="rounded-lg border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          If this takes more than a minute, open Billing and confirm your subscription status in Stripe.
        </p>
      ) : null}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <p className="text-[11px] text-white/45">Secure checkout by Stripe.</p>
      <div className="hidden">
        {/* spacer for consistent card height in quick transitions */}
      </div>
    </div>
  );
}
