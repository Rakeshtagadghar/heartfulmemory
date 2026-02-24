import type { Metadata } from "next";
import { AuthPageShell } from "../../components/auth/auth-page-shell";
import { MagicLinkForm } from "../../components/auth/magic-link-form";
import { getSafeReturnTo } from "../../lib/auth/server";

export const metadata: Metadata = {
  title: "Login | Memorioso",
  description: "Sign in to Memorioso to create and manage family storybooks."
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const returnTo = getSafeReturnTo(
    typeof query.returnTo === "string" ? query.returnTo : undefined,
    "/app"
  );

  let message: string | null = null;
  if (query.loggedOut === "1") message = "You were signed out.";
  if (query.error === "CredentialsSignin") message = "Could not sign you in. Please try again.";

  return (
    <AuthPageShell>
      <MagicLinkForm
        returnTo={returnTo}
        configMissing={query.config === "missing"}
        initialMessage={message}
      />
    </AuthPageShell>
  );
}
