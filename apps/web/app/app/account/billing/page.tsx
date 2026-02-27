import Link from "next/link";
import { Card } from "../../../../components/ui/card";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { anyApi, convexQuery } from "../../../../lib/convex/ops";
import { ManageBillingButton } from "../../../../components/billing/ManageBillingButton";
import { PlanBenefits } from "../../../../components/billing/PlanBenefits";
import { UpgradeCheckoutButton } from "../../../../components/billing/UpgradeCheckoutButton";
import { UpgradeCheckoutLauncher } from "../../../../components/billing/UpgradeCheckoutLauncher";
import { BILLING_PLAN_CATALOG } from "../../../../../../packages/shared/billing/entitlements";

function formatDate(value: number | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

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
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      cancelAt: number | null;
      canceledAt: number | null;
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

  const planId = billingState.ok ? billingState.data.entitlements.planId : "free";
  const entitlements = billingState.ok ? billingState.data.entitlements : null;
  const subscription = billingState.ok ? billingState.data.subscription : null;
  const usage = billingState.ok ? billingState.data.usage : null;
  const quotaLimit = BILLING_PLAN_CATALOG[planId].limits.exportsPerMonth ?? 0;
  const isCancelling = Boolean(subscription?.cancelAtPeriodEnd || subscription?.cancelAt);
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
              {isCancelling ? (
                <span className="ml-2 text-sm font-normal text-amber-300/80">(cancels at period end)</span>
              ) : null}
            </p>
          </div>
        </div>

        {planId === "pro" && subscription ? (
          <div className="mt-5 grid gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">Current billing period</p>
              <p className="mt-1 text-sm text-white/85">
                {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">Next charge date</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {subscription.cancelAtPeriodEnd ? "No renewal" : formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">Price</p>
              <p className="mt-1 text-sm text-white/85">GBP 30/month</p>
            </div>
          </div>
        ) : null}

        {planId === "pro" && usage ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">PDF exports this period</p>
              <p className="text-sm text-white/85">
                {usage.used} / {quotaLimit} used
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400/70 transition-all"
                style={{ width: `${Math.min(100, quotaLimit > 0 ? (usage.used / quotaLimit) * 100 : 0)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-white/50">
              {entitlements?.exportsRemaining !== null && entitlements?.exportsRemaining !== undefined
                ? `${Math.max(0, entitlements.exportsRemaining)} exports remaining`
                : "Unlimited exports"}
              {" · "}Resets {formatDate(usage.periodEnd)}
            </p>
          </div>
        ) : null}

        {planId === "pro" ? <PlanBenefits className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/80" /> : null}

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
