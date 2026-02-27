import Link from "next/link";
import { Card } from "../../../../components/ui/card";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { anyApi, convexQuery } from "../../../../lib/convex/ops";
import { ManageBillingButton } from "../../../../components/billing/ManageBillingButton";
import { PlanBenefits } from "../../../../components/billing/PlanBenefits";
import { UpgradeCheckoutButton } from "../../../../components/billing/UpgradeCheckoutButton";
import { UpgradeCheckoutLauncher } from "../../../../components/billing/UpgradeCheckoutLauncher";

export default async function BillingAccountPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuthenticatedUser("/app/account/billing");
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const intentParam = resolvedSearchParams.intent;
  const checkoutErrorParam = resolvedSearchParams.checkoutError;
  const intent = Array.isArray(intentParam) ? intentParam[0] : intentParam;
  const checkoutError = Array.isArray(checkoutErrorParam) ? checkoutErrorParam[0] : checkoutErrorParam;

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
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
    } | null;
  }>(anyApi.billing.getEntitlementsForViewer, {
    viewerSubject: user.id
  });

  const planId = billingState.ok ? billingState.data.entitlements.planId : "free";
  const subscription = billingState.ok ? billingState.data.subscription : null;
  const shouldAutostartUpgrade = planId !== "pro" && intent === "upgrade";

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Billing</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Plan and billing</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          Manage your subscription and payment method from Stripe Customer Portal.
        </p>
      </Card>

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Current plan</p>
            <p className="mt-2 text-lg font-semibold text-white">{planId === "pro" ? "Pro" : "Free"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Subscription status</p>
            <p className="mt-2 text-lg font-semibold capitalize text-white">
              {subscription?.status?.replaceAll("_", " ") ?? "none"}
            </p>
          </div>
        </div>

        {planId === "pro" ? <PlanBenefits className="mt-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/80" /> : null}

        <UpgradeCheckoutLauncher enabled={shouldAutostartUpgrade} returnTo="/app/account/billing" />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {planId === "pro" ? (
            <ManageBillingButton returnUrl="/app/account/billing" />
          ) : (
            <UpgradeCheckoutButton returnTo="/app/account/billing" />
          )}
          <Link href="/app/account/invoices" className="text-sm text-gold hover:text-[#e8cc95]">
            Invoices
          </Link>
          <Link href="/app" className="text-sm text-gold hover:text-[#e8cc95]">
            Back to dashboard
          </Link>
        </div>

        {billingState.ok ? null : (
          <p className="mt-4 text-xs text-rose-100">
            Could not load billing entitlements. You can still open Stripe portal if you already upgraded.
          </p>
        )}
        {checkoutError ? (
          <p className="mt-2 text-xs text-rose-100">Checkout could not be started: {checkoutError}</p>
        ) : null}
      </Card>
    </div>
  );
}
