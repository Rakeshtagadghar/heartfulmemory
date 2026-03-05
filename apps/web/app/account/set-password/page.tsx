import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageShell } from "../../../components/auth/auth-page-shell";
import { Card } from "../../../components/ui/card";
import { SetPasswordForm } from "../../../components/account/SetPasswordForm";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { getSafeReturnTo, requireAuthenticatedUser } from "../../../lib/auth/server";
import { getSetPasswordSkipWindowMs, setPasswordPolicy } from "../../../lib/config/setPasswordPolicy";

export const metadata: Metadata = {
  title: "Set Password | Memorioso",
  description: "Add a password to your Memorioso account for easier sign-in."
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SetPasswordPage({ searchParams }: Props) {
  const query = await searchParams;
  const user = await requireAuthenticatedUser("/account/set-password");
  const profile = await getOrCreateProfileForUser(user);

  const returnTo = getSafeReturnTo(typeof query.returnTo === "string" ? query.returnTo : undefined, "/app");
  if (profile.has_password) {
    redirect(returnTo);
  }

  return (
    <AuthPageShell>
      <Card className="p-6 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Account security</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-parchment sm:text-5xl">Set your password</h1>
        <p className="mt-3 text-sm leading-7 text-white/75">
          You can continue using email links, but adding a password gives you another secure sign-in option.
        </p>
        <div className="mt-5">
          <SetPasswordForm
            returnTo={returnTo}
            allowSkip={setPasswordPolicy.allowSkip}
            skipWindowMs={getSetPasswordSkipWindowMs(setPasswordPolicy)}
          />
        </div>
      </Card>
    </AuthPageShell>
  );
}

