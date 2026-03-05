import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "../../components/app/app-shell";
import { getOrCreateProfileForUser } from "../../lib/profile";
import { requireAuthenticatedUser } from "../../lib/auth/server";
import { noindexMetadata } from "../../lib/seo/metadata";

export const metadata: Metadata = noindexMetadata;

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser("/app");
  const profile = await getOrCreateProfileForUser(user);

  return (
    <AppShell email={user.email} profile={profile}>
      {children}
    </AppShell>
  );
}
