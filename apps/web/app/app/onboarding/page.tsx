import { Card } from "../../../components/ui/card";
import { OnboardingForm } from "../../../components/app/onboarding-form";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { requireAuthenticatedUser } from "../../../lib/auth/server";

export default async function OnboardingPage() {
  const user = await requireAuthenticatedUser("/app/onboarding");
  const profile = await getOrCreateProfileForUser(user);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Before you begin</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Tell us how you want to start</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          This onboarding stays minimal: your name, your primary goal, and optional updates consent. Data is stored in Convex when configured, with a local fallback for development.
        </p>
      </Card>
      <OnboardingForm initialDisplayName={profile.display_name} initialGoal={profile.onboarding_goal} />
    </div>
  );
}
