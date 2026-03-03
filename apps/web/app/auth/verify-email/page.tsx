import type { Metadata } from "next";
import Link from "next/link";
import { AuthPageShell } from "../../../components/auth/auth-page-shell";
import { Card } from "../../../components/ui/card";
import { VerifyEmailForm } from "../../../components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verify Email | Memorioso",
  description: "Verify your email address to continue."
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : null;

  return (
    <AuthPageShell>
      <Card className="p-6 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Verify email</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-parchment sm:text-5xl">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/75">
          Enter the verification code from your email.
        </p>

        <div className="mt-5">
          <VerifyEmailForm initialToken={token} />
        </div>

        <p className="mt-4 text-sm text-white/70">
          Did not receive a code?{" "}
          <Link href="/auth/sign-in" className="underline underline-offset-2 hover:text-white">
            Back to sign in
          </Link>
        </p>
      </Card>
    </AuthPageShell>
  );
}
