import { NextResponse } from "next/server";
import { anyApi, convexQuery } from "../../../../lib/convex/ops";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getBillingRuntimeConfig } from "../../../../lib/config/billingMode";
import { BILLING_PLAN_CATALOG } from "../../../../../../packages/shared/billing/entitlements";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAuthenticatedUser("/app");
  const billingMode = getBillingRuntimeConfig().mode;
  const result = await convexQuery<{
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
  }>(anyApi.billing.getEntitlementsForViewer, {
    viewerSubject: user.id
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  const quotaLimit = BILLING_PLAN_CATALOG[result.data.entitlements.planId].limits.exportsPerMonth ?? 0;
  const used = result.data.usage?.used ?? 0;
  const remaining =
    typeof result.data.entitlements.exportsRemaining === "number"
      ? result.data.entitlements.exportsRemaining
      : null;

  return NextResponse.json({
    ok: true,
    data: {
      billingMode,
      entitlements: result.data.entitlements,
      subscription: result.data.subscription,
      usage: result.data.usage ?? null,
      quota: {
        used,
        limit: quotaLimit,
        remaining
      }
    }
  });
}
