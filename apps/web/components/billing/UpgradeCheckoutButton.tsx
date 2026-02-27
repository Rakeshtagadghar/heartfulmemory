"use client";

import { useState } from "react";
import { startCheckout } from "../../lib/billing/startCheckout";
import { Button } from "../ui/button";

export function UpgradeCheckoutButton({
  returnTo = "/app/account/billing"
}: {
  returnTo?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    const encodedReturnTo = encodeURIComponent(returnTo);
    const result = await startCheckout({
      cadence: "monthly",
      successUrl: `/billing/success?source=billing_page&returnTo=${encodedReturnTo}`,
      cancelUrl: `/billing/cancel?source=billing_page&returnTo=${encodedReturnTo}`
    });
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }
    globalThis.location.href = result.checkoutUrl;
  }

  return (
    <div className="space-y-2">
      <Button type="button" loading={loading} onClick={() => void handleUpgrade()}>
        Upgrade to Pro
      </Button>
      {error ? <p className="text-xs text-rose-100">{error}</p> : null}
    </div>
  );
}
