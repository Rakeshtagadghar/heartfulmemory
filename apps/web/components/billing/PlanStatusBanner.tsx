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
    ? "flex flex-wrap items-center gap-2 text-[11px]"
    : "mt-3 flex flex-wrap items-center gap-2 text-xs";

  return (
    <>
      <div className={wrapperClassName}>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold uppercase tracking-[0.14em] ${labelClassName}`}>
          {isPro ? "Pro" : "Free"}
        </span>
        <span className="text-white/70">{quotaLabel(data.quota)}</span>
        {data.billingMode === "test" ? (
          <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-100">
            Payments sandbox
          </span>
        ) : null}
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

