import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "../../components/ui/card";
import { getOrCreateProfileForUser } from "../../lib/profile";
import { requireAuthenticatedUser } from "../../lib/auth/server";
import { listStorybooksForUser } from "../../lib/data/storybooks";
import { StorybooksList } from "../../components/storybooks/storybooks-list";

export default async function AppDashboardPage() {
  const user = await requireAuthenticatedUser("/app");
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const storybooks = await listStorybooksForUser(user.id);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Dashboard</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">
          Welcome back{profile.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          Your storybooks are now loaded from Convex with owner-first access checks. Start a blank book or use a template, then reopen it here after refresh.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/app/start"
            className="inline-flex h-10 items-center rounded-xl border border-gold/65 bg-gold px-4 text-sm font-semibold text-ink"
          >
            Create storybook
          </Link>
          <Link
            href="/app/onboarding"
            className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white"
          >
            Update onboarding
          </Link>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-parchment">Your storybooks</h2>
          {storybooks.ok ? (
            <p className="text-sm text-white/55">{storybooks.data.length} total</p>
          ) : null}
        </div>

        {storybooks.ok ? (
          <StorybooksList storybooks={storybooks.data} />
        ) : (
          <Card className="p-5">
            <p className="text-sm text-rose-100">Could not load storybooks: {storybooks.error}</p>
          </Card>
        )}
      </section>
    </div>
  );
}

