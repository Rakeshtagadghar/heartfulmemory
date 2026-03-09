import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "../../components/app/app-shell";
import { getOrCreateProfileForUser } from "../../lib/profile";
import { requireAuthenticatedUser } from "../../lib/auth/server";
import { noindexMetadata } from "../../lib/seo/metadata";
import { getAdminUserByUserId } from "../../lib/admin/adminOps";

export const metadata: Metadata = noindexMetadata;

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser("/app");
  const profile = await getOrCreateProfileForUser(user);
  const adminRecord = await getAdminUserByUserId(user.id);
  const isAdmin = adminRecord?.status === "active";

  return (
    <AppShell email={user.email} profile={profile} isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
