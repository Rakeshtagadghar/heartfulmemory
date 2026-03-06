import type { Metadata } from "next";
import { AppShell } from "../../components/app/app-shell";
import { EmbeddedPortal } from "../../components/featurebase/EmbeddedPortal";
import { Card } from "../../components/ui/card";
import { requireAuthenticatedUser } from "../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../lib/profile";
import { noindexMetadata } from "../../lib/seo/metadata";

export const metadata: Metadata = noindexMetadata;

export default async function FeedbackPage() {
  const user = await requireAuthenticatedUser("/feedback");
  const profile = await getOrCreateProfileForUser(user);
  const portalUrl = process.env.NEXT_PUBLIC_FEATUREBASE_PORTAL_URL?.trim() || null;

  return (
    <AppShell email={user.email} profile={profile}>
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Feedback Portal</p>
          <h1 className="mt-2 font-display text-4xl text-parchment">Roadmap, changelog, and feedback</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
            Use this space to browse updates, review roadmap items, and submit or vote on ideas without leaving the app.
          </p>
        </Card>
        <EmbeddedPortal portalUrl={portalUrl} />
      </div>
    </AppShell>
  );
}
