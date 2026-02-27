import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { anyApi, convexQuery } from "../../../../lib/convex/ops";
import { Card } from "../../../../components/ui/card";
import { InvoicesCard } from "../../../../components/billing/InvoicesCard";

export default async function AccountInvoicesPage() {
  const user = await requireAuthenticatedUser("/app/account/invoices");
  const billingState = await convexQuery<{
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
  }>(anyApi.billing.getEntitlementsForViewer, {
    viewerSubject: user.id
  });

  const planId = billingState.ok ? billingState.data.entitlements.planId : "free";
  const subscription = billingState.ok ? billingState.data.subscription : null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Invoices</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Billing invoices</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          Manage and download invoices from Stripe Customer Portal.
        </p>
      </Card>

      <InvoicesCard
        planId={planId}
        subscription={
          subscription
            ? {
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
              }
            : null
        }
      />
    </div>
  );
}
