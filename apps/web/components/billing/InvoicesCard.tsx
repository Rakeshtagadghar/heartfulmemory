import Link from "next/link";
import { ManageBillingButton } from "./ManageBillingButton";

type InvoicesCardProps = {
  planId: "free" | "pro";
  subscription: {
    status: string;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
    cancelAt?: number | null;
  } | null;
};

function formatDate(value: number | null) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function InvoicesCard({ planId, subscription }: InvoicesCardProps) {
  if (planId !== "pro") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm text-white/80">You are on the Free plan. Invoices appear after upgrading to Pro.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/app/account/billing?intent=upgrade"
            className="inline-flex items-center rounded-lg border border-gold/55 bg-gold/90 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-[#e3c17b]"
          >
            Upgrade to export
          </Link>
          <Link href="/app/account/billing" className="text-sm text-gold hover:text-[#e8cc95]">
            View billing page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Current plan</p>
          <p className="mt-1 text-lg font-semibold text-white">Pro</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Next billing date</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatDate(subscription?.currentPeriodEnd ?? null)}</p>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Payment status</p>
        <p className="mt-1 text-sm capitalize text-white/85">
          {subscription?.status?.replaceAll("_", " ") ?? "active"}
          {(subscription?.cancelAtPeriodEnd || subscription?.cancelAt) ? " (cancels at period end)" : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ManageBillingButton returnUrl="/app/account/invoices" />
        <Link href="/app/account/billing" className="text-sm text-gold hover:text-[#e8cc95]">
          Back to billing
        </Link>
      </div>
      <p className="text-xs text-white/55">
        Invoice PDFs and receipts are available in Stripe Customer Portal.
      </p>
    </div>
  );
}
