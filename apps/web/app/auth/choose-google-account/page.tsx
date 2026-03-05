import type { Metadata } from "next";
import { AuthPageShell } from "../../../components/auth/auth-page-shell";
import { Card } from "../../../components/ui/card";
import { GoogleChooserActions } from "../../../components/auth/GoogleChooserActions";
import { getSafeReturnTo } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Continue with Google | Memorioso",
  description: "Choose which Google account you want to use for Memorioso."
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChooseGoogleAccountPage({ searchParams }: Props) {
  const query = await searchParams;
  const returnTo = getSafeReturnTo(
    typeof query.returnTo === "string" ? query.returnTo : undefined,
    "/app"
  );

  return (
    <AuthPageShell>
      <Card className="p-6 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Google sign-in</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-parchment sm:text-5xl">Continue with Google</h1>
        <p className="mt-3 text-sm leading-7 text-white/75">
          Choose the Google account you want to use. This helps on shared devices where multiple Google accounts are signed in.
        </p>
        <div className="mt-5">
          <GoogleChooserActions returnTo={returnTo} />
        </div>
      </Card>
    </AuthPageShell>
  );
}

