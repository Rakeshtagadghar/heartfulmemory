import { Card } from "../../../components/ui/card";
import { requireAuthenticatedUser, getSafeReturnTo } from "../../../lib/auth/server";
import { BillingSuccessState } from "../../../components/billing/BillingSuccessState";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  await requireAuthenticatedUser("/billing/success");
  const params = searchParams ? await searchParams : {};
  const returnTo = getSafeReturnTo(firstString(params.returnTo), "/app");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card className="p-6">
        <BillingSuccessState returnTo={returnTo} />
      </Card>
    </div>
  );
}
