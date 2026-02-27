"use client";

import { useEffect, useRef } from "react";
import { startCheckout } from "../../lib/billing/startCheckout";

export function UpgradeCheckoutLauncher({
  enabled,
  returnTo = "/app/account/billing"
}: {
  enabled: boolean;
  returnTo?: string;
}) {
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasStartedRef.current) return;
    hasStartedRef.current = true;
    const encodedReturnTo = encodeURIComponent(returnTo);
    void startCheckout({
      cadence: "monthly",
      successUrl: `/billing/success?source=billing_upgrade_intent&returnTo=${encodedReturnTo}`,
      cancelUrl: `/billing/cancel?source=billing_upgrade_intent&returnTo=${encodedReturnTo}`
    }).then((result) => {
      if (result.ok) {
        globalThis.location.href = result.checkoutUrl;
        return;
      }
      const fallbackTarget = `/app/account/billing?checkoutError=${encodeURIComponent(result.error)}`;
      globalThis.location.href = fallbackTarget;
    });
  }, [enabled, returnTo]);

  if (!enabled) return null;

  return (
    <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-4">
      <p className="text-sm text-white/85">Starting Stripe checkout for Pro export...</p>
    </div>
  );
}
