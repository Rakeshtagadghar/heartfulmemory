import type { Metadata } from "next";
import Link from "next/link";
import { AuthPageShell } from "../../../components/auth/auth-page-shell";
import { MagicLinkForm } from "../../../components/auth/magic-link-form";
import { getSafeReturnTo } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Sign Up | Memorioso",
  description: "Create your Memorioso account."
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const query = await searchParams;
  const returnTo = getSafeReturnTo(
    typeof query.returnTo === "string" ? query.returnTo : undefined,
    "/app/onboarding"
  );
  const token = typeof query.token === "string" ? query.token : null;
  const allowGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <AuthPageShell>
      <div className="space-y-4">
        <MagicLinkForm
          returnTo={returnTo}
          configMissing={query.config === "missing"}
          initialMessage="We will send a secure email link to create your account and continue."
          initialMagicToken={token}
          allowGoogle={allowGoogle}
        />
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
          <p>
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="underline underline-offset-2 hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}
