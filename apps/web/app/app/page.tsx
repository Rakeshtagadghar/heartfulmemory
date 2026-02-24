import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "../../components/ui/card";
import { getOrCreateProfileForUser } from "../../lib/profile";
import { requireAuthenticatedUser } from "../../lib/auth/server";
import { listStorybooksForUser } from "../../lib/data/storybooks";
import { StorybooksDashboardPanel } from "../../components/storybooks/storybooks-dashboard-panel";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

export default async function AppDashboardPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
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
          Your storybooks are loaded from Convex with owner-first access checks. Create a quick blank draft here, or use the guided template flow and continue editing after refresh.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/app/onboarding"
            className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white"
          >
            Update onboarding
          </Link>
        </div>
      </Card>

      <StorybooksDashboardPanel
        initialStorybooks={storybooks.ok ? storybooks.data : []}
        initialError={storybooks.ok ? getSearchString(resolvedSearchParams, "error") ?? null : storybooks.error}
      />
    </div>
  );
}
