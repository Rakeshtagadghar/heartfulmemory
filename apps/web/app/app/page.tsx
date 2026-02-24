import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "../../components/ui/card";
import { getOrCreateProfileForUser } from "../../lib/profile";
import { requireAuthenticatedUser } from "../../lib/auth/server";

export default async function AppDashboardPage() {
  const user = await requireAuthenticatedUser("/app");
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Dashboard</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Welcome back{profile.display_name ? `, ${profile.display_name}` : ""}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          Sprint 3.5 migrates auth and backend persistence to Auth.js + Convex. Sprint 4 will build storybook CRUD on Convex schema and access checks.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/app/start" className="inline-flex h-10 items-center rounded-xl border border-gold/65 bg-gold px-4 text-sm font-semibold text-ink">
            Create your first storybook
          </Link>
          <Link href="/app/onboarding" className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white">
            Update onboarding
          </Link>
        </div>
      </Card>
    </div>
  );
}
