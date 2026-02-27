"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { trackCheckoutRedirected, trackPaywallShown, trackPaywallUpgradeClick } from "../../lib/analytics/billingEvents";
import { startCheckout } from "../../lib/billing/startCheckout";
import { Button } from "../ui/button";
import { PlanBenefits } from "./PlanBenefits";

type UpgradeCadence = "monthly";

export function UpgradeModal({
  open,
  onClose,
  source = "studio_export"
}: {
  open: boolean;
  onClose: () => void;
  source?: "studio_export";
}) {
  const cadence: UpgradeCadence = "monthly";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    trackPaywallShown({ source, planId: "free" });
  }, [open, source]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  async function handleUpgradeClick() {
    setLoading(true);
    setError(null);
    trackPaywallUpgradeClick({ planId: "pro", cadence });
    const returnTo = encodeURIComponent(globalThis.location.pathname + globalThis.location.search);

    const result = await startCheckout({
      cadence,
      successUrl: `/billing/success?source=studio_export&returnTo=${returnTo}`,
      cancelUrl: `/billing/cancel?source=studio_export&returnTo=${returnTo}`
    });

    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }

    trackCheckoutRedirected({ planId: "pro", cadence });
    globalThis.location.href = result.checkoutUrl;
  }

  const modal = (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-gold/40 bg-[#0b1320] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.16em] text-gold/80">Memorioso Pro</p>
        <h3 className="mt-2 text-2xl font-semibold text-parchment">Upgrade to Export</h3>
        <p className="mt-3 text-sm leading-6 text-white/75">
          Unlock Pro export at GBP 30/month with 100 PDF exports each month.
        </p>

        <PlanBenefits />

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-sm text-white/70">
          Already Pro?{" "}
          <Link href="/app/account/billing" className="text-gold hover:text-[#e8cc95]">
            Manage Billing
          </Link>
        </p>
        <p className="mt-1 text-xs text-white/55">
          Need more exports? Volume plans are coming soon.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button type="button" size="lg" loading={loading} onClick={() => void handleUpgradeClick()}>
            Upgrade with Stripe
          </Button>
          <Button type="button" variant="ghost" size="lg" disabled={loading} onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
