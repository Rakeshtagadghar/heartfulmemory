import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { anyApi, convexMutation, convexQuery } from "../../../../lib/convex/ops";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getStripeClientForBilling } from "../../../../lib/stripe/stripeClientFactory";
import { mapStripeSubscriptionForUpsert } from "../../../../lib/stripe/webhookMapper";

export const runtime = "nodejs";

type EntitlementsResponseData = {
  customer?: {
    stripeCustomerId: string;
  } | null;
  entitlements: {
    planId: "free" | "pro";
    subscriptionStatus: "none" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
    canExportDigital: boolean;
    canExportHardcopy: boolean;
    exportsRemaining: number | null;
  };
  subscription: {
    stripeSubscriptionId: string;
    planId: string;
    status: string;
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

function pickSubscriptionForRecovery(subscriptions: Stripe.Subscription[]) {
  if (subscriptions.length === 0) return null;
  const statusRank: Record<string, number> = {
    active: 5,
    trialing: 4,
    past_due: 3,
    unpaid: 2,
    incomplete: 1,
    canceled: 0
  };
  return subscriptions
    .slice()
    .sort((a, b) => {
      const rankA = statusRank[a.status] ?? 0;
      const rankB = statusRank[b.status] ?? 0;
      if (rankA !== rankB) return rankB - rankA;
      return b.created - a.created;
    })[0] ?? null;
}

async function tryRecoverSubscription(userId: string, stripeCustomerId: string) {
  try {
    const stripeFactory = getStripeClientForBilling();
    if (!stripeFactory.ok) return;

    const stripeSubscriptions = await stripeFactory.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 10
    });
    const candidate = pickSubscriptionForRecovery(stripeSubscriptions.data);
    if (!candidate) return;

    const mapped = mapStripeSubscriptionForUpsert({
      subscription: candidate,
      fallbackUserId: userId
    });
    if (!mapped) return;

    // Use the public mutation (no CONVEX_DEPLOY_KEY required).
    // The shared BILLING_RECOVERY_TOKEN is the authorization — it must also be
    // configured as an environment variable in the Convex dashboard.
    const serverToken = process.env.BILLING_RECOVERY_TOKEN ?? "";
    if (!serverToken) return; // misconfigured — skip silently

    await convexMutation(anyApi.billing.upsertSubscriptionFromRecoveryForViewer, {
      serverToken,
      ...mapped
    });
  } catch {
    // Fail silently — recovery is best-effort; the polling loop will retry
  }
}

export async function GET() {
  const user = await requireAuthenticatedUser("/app");
  let result = await convexQuery<EntitlementsResponseData>(anyApi.billing.getEntitlementsForViewer, {
    viewerSubject: user.id
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  const stripeCustomerId = result.data.customer?.stripeCustomerId ?? null;
  const subStatus = result.data.subscription?.status;
  const needsRecovery = !result.data.subscription || subStatus === "incomplete";
  if (needsRecovery && stripeCustomerId) {
    await tryRecoverSubscription(user.id, stripeCustomerId);
    result = await convexQuery<EntitlementsResponseData>(anyApi.billing.getEntitlementsForViewer, {
      viewerSubject: user.id
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, data: result.data });
}
