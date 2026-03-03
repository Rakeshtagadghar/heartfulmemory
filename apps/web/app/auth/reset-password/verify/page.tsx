import type { Metadata } from "next";
import Link from "next/link";
import { AuthPageShell } from "../../../../components/auth/auth-page-shell";
import { Card } from "../../../../components/ui/card";
import { ResetPasswordVerifyForm } from "../../../../components/auth/reset-password-verify-form";

export const metadata: Metadata = {
  title: "Set New Password | Memorioso",
  description: "Verify reset and set a new account password."
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordVerifyPage({ searchParams }: Props) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : null;

  return (
    <AuthPageShell>
      <Card className="p-6 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Set new password</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-parchment sm:text-5xl">
          Create a new password
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/75">
          Enter your verification code and choose a new password.
        </p>
        <div className="mt-5">
          <ResetPasswordVerifyForm initialToken={token} />
        </div>
        <p className="mt-4 text-sm text-white/70">
          Need a new reset email?{" "}
          <Link href="/auth/reset-password" className="underline underline-offset-2 hover:text-white">
            Request again
          </Link>
        </p>
      </Card>
    </AuthPageShell>
  );
}
