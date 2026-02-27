"use client";

type StartCheckoutInput = {
  priceId?: string;
  cadence?: "monthly" | "annual";
  successUrl?: string;
  cancelUrl?: string;
};

type StartCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult> {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  const body = (await response.json().catch(() => null)) as
    | { ok: true; checkoutUrl: string }
    | { ok?: false; error?: string }
    | null;

  if (!response.ok || !body || body.ok !== true || typeof body.checkoutUrl !== "string") {
    const bodyError = (body as { error?: unknown } | null)?.error;
    const error = typeof bodyError === "string" ? bodyError : "Unable to start checkout.";
    return { ok: false, error };
  }
  return { ok: true, checkoutUrl: body.checkoutUrl };
}
