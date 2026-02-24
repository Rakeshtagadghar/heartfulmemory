import type { ReactNode } from "react";
import { AppShell } from "../../components/app/app-shell";
import { getOrCreateProfileForUser } from "../../lib/profile";
import { requireAuthenticatedUser } from "../../lib/auth/server";

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser("/app");
  const profile = await getOrCreateProfileForUser(user);

  return (
    <AppShell email={user.email} profile={profile}>
      {children}
    </AppShell>
  );
}
