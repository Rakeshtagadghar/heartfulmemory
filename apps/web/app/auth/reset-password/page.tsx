import type { Metadata } from "next";
import Link from "next/link";
import { AuthPageShell } from "../../../components/auth/auth-page-shell";
import { Card } from "../../../components/ui/card";
import { ResetPasswordRequestForm } from "../../../components/auth/reset-password-request-form";

export const metadata: Metadata = {
  title: "Reset Password | Memorioso",
  description: "Request a password reset for your Memorioso account."
};

export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <Card className="p-6 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Reset password</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-parchment sm:text-5xl">
          Forgot your password?
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/75">
          Enter your email and we will send reset instructions.
        </p>
        <div className="mt-5">
          <ResetPasswordRequestForm />
        </div>
        <p className="mt-4 text-sm text-white/70">
          Remembered it?{" "}
          <Link href="/auth/sign-in" className="underline underline-offset-2 hover:text-white">
            Back to sign in
          </Link>
        </p>
      </Card>
    </AuthPageShell>
  );
}

