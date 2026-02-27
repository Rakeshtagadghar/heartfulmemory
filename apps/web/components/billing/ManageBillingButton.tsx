"use client";

import { useState } from "react";
import { Button } from "../ui/button";

type PortalResponse =
  | { ok: true; portalUrl: string }
  | { ok?: false; error?: string };

export function ManageBillingButton({
  returnUrl = "/app/account/billing"
}: {
  returnUrl?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ returnUrl })
    });

    const body = (await response.json().catch(() => null)) as PortalResponse | null;
    if (!response.ok || !body || body.ok !== true || typeof body.portalUrl !== "string") {
      setLoading(false);
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        setError(body.error);
      } else {
        setError("Unable to open Stripe billing portal.");
      }
      return;
    }

    globalThis.location.href = body.portalUrl;
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" loading={loading} onClick={() => void openPortal()}>
        Manage Billing
      </Button>
      {error ? <p className="text-xs text-rose-100">{error}</p> : null}
    </div>
  );
}
