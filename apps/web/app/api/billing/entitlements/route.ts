import { NextResponse } from "next/server";
import { anyApi, convexMutation, convexQuery } from "../../../../lib/convex/ops";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { recoverBillingSubscriptionForUser } from "../../../../lib/billing/recovery";

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

async function tryRecoverSubscription(userId: string, stripeCustomerId: string) {
  try {
    await recoverBillingSubscriptionForUser(userId, stripeCustomerId);
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
