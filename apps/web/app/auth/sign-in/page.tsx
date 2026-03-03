import type { Metadata } from "next";
import Link from "next/link";
import { AuthPageShell } from "../../../components/auth/auth-page-shell";
import { MagicLinkForm } from "../../../components/auth/magic-link-form";
import { getSafeReturnTo } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Sign In | Memorioso",
  description: "Sign in to Memorioso to continue your storybook."
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: Props) {
  const query = await searchParams;
  const returnTo = getSafeReturnTo(
    typeof query.returnTo === "string" ? query.returnTo : undefined,
    "/app"
  );
  const token = typeof query.token === "string" ? query.token : null;
  const allowGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <AuthPageShell>
      <div className="space-y-4">
        <MagicLinkForm
          returnTo={returnTo}
          configMissing={query.config === "missing"}
          initialMessage={typeof query.message === "string" ? query.message : null}
          initialMagicToken={token}
          allowGoogle={allowGoogle}
        />
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
          <p className="font-semibold text-white/85">Other sign-in methods</p>
          <p className="mt-1">
            Use password if you have one, or request a secure email sign-in link.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/auth/reset-password" className="underline underline-offset-2 hover:text-white">
              Forgot password?
            </Link>
            <Link href="/auth/sign-up" className="underline underline-offset-2 hover:text-white">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}
