import { NextResponse } from "next/server";
import { anyApi, convexQuery } from "../../../../lib/convex/ops";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAuthenticatedUser("/app");
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
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
    } | null;
  }>(anyApi.billing.getEntitlementsForViewer, {
    viewerSubject: user.id
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data: result.data });
}

