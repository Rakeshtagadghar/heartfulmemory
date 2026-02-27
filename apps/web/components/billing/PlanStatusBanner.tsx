"use client";

import Link from "next/link";
import { useState } from "react";
import { usePlanStatus } from "../../lib/billing/usePlanStatus";
import { UpgradeModal } from "./UpgradeModal";

function quotaLabel(input: { used: number; limit: number; remaining: number | null }) {
  if (input.remaining === null) return "Unlimited exports";
  return `${Math.max(0, input.remaining)}/${input.limit} exports left this month`;
}

export function PlanStatusBanner({ compact = false }: { compact?: boolean }) {
  const { data, loading } = usePlanStatus({ pollIntervalMs: 10000 });
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (loading || !data) return null;

  const isPro = data.entitlements.planId === "pro";
  const labelClassName = isPro
    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
    : "border-amber-300/30 bg-amber-500/10 text-amber-100";
  const wrapperClassName = compact
    ? "flex items-center gap-2 whitespace-nowrap text-[11px]"
    : "mt-3 flex flex-wrap items-center gap-2 text-xs";

  return (
    <>
      <div className={wrapperClassName}>
        <div className="group relative">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold uppercase tracking-[0.14em] ${labelClassName}`}
          >
            {isPro ? "Pro" : "Free"}
            {data.billingMode === "test" ? (
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="Payments sandbox"
              >
                <path d="M10 3h4" />
                <path d="M10 3v4l-4.5 8.2A4 4 0 0 0 9 21h6a4 4 0 0 0 3.5-5.8L14 7V3" />
                <path d="M8.5 14h7" />
              </svg>
            ) : null}
          </span>
          <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0a111d]/95 px-2 py-1 text-[10px] text-white/90 opacity-0 shadow-lg transition group-hover:opacity-100">
            {quotaLabel(data.quota)}
          </span>
        </div>
        {isPro ? (
          <>
            <Link href="/app/account/billing" className="rounded-lg border border-white/20 bg-white/[0.03] px-2 py-1 text-white/85 hover:bg-white/[0.06]">
              Manage Billing
            </Link>
            <Link href="/app/account/invoices" className="rounded-lg border border-white/15 px-2 py-1 text-white/75 hover:bg-white/[0.05] hover:text-white">
              Invoices
            </Link>
          </>
        ) : (
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-gold/55 bg-gold/90 px-2 py-1 font-semibold text-ink hover:bg-[#e3c17b]"
            onClick={() => setUpgradeOpen(true)}
          >
            Upgrade
          </button>
        )}
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} source="studio_export" />
    </>
  );
}
