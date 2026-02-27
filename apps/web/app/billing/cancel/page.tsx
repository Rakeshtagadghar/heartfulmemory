import Link from "next/link";
import { Card } from "../../../components/ui/card";
import { requireAuthenticatedUser, getSafeReturnTo } from "../../../lib/auth/server";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BillingCancelPage({ searchParams }: Props) {
  await requireAuthenticatedUser("/billing/cancel");
  const params = searchParams ? await searchParams : {};
  const returnTo = getSafeReturnTo(firstString(params.returnTo), "/app");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card className="space-y-5 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-gold/80">Billing</p>
        <h1 className="text-2xl font-semibold text-parchment">Checkout cancelled</h1>
        <p className="text-sm text-white/75">
          Your plan was not changed. You can continue editing and upgrade anytime from Export.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={returnTo} className="inline-flex h-10 items-center rounded-xl border border-white/20 bg-white/[0.03] px-4 text-sm font-semibold text-white hover:bg-white/[0.06]">
            Return to Studio
          </Link>
          <Link href="/app/account/billing" className="text-sm text-gold hover:text-[#e8cc95]">
            Open billing page
          </Link>
        </div>
      </Card>
    </div>
  );
}
