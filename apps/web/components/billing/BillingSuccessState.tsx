"use client";

import Link from "next/link";
import { useEntitlements } from "../../lib/billing/useEntitlements";
import { Button } from "../ui/button";

export function BillingSuccessState({
  returnTo
}: {
  returnTo: string;
}) {
  const { entitlements, loading, refresh } = useEntitlements({ pollIntervalMs: 3000 });
  const isActive = Boolean(entitlements?.canExportDigital);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-gold/80">Billing</p>
        <h1 className="mt-2 text-2xl font-semibold text-parchment">Payment received</h1>
        <p className="mt-3 text-sm text-white/75">
          {isActive
            ? "Your Pro plan is active. Export is now unlocked."
            : loading
              ? "Activating your plan... This can take a few seconds while webhooks sync."
              : "We are still waiting for webhook confirmation. Please retry in a moment."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={returnTo} className="inline-flex h-10 items-center rounded-xl border border-gold/65 bg-gold px-4 text-sm font-semibold text-ink hover:bg-[#e3c17b]">
          Return to Studio
        </Link>
        <Button type="button" variant="secondary" onClick={() => void refresh()}>
          Refresh status
        </Button>
      </div>
    </div>
  );
}
