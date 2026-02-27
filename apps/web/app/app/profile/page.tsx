import { Card } from "../../../components/ui/card";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { requireAuthenticatedUser } from "../../../lib/auth/server";

export default async function ProfilePage() {
  const user = await requireAuthenticatedUser("/app/profile");
  const profile = await getOrCreateProfileForUser(user);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Profile</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Your account</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          Basic profile details for your Memorioso workspace.
        </p>
      </Card>

      <Card className="p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Display name</dt>
            <dd className="mt-2 text-sm text-white/90">{profile.display_name || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Email</dt>
            <dd className="mt-2 text-sm text-white/90">{user.email || "Not available"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Onboarding</dt>
            <dd className="mt-2 text-sm text-white/90">{profile.onboarding_completed ? "Completed" : "Pending"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Goal</dt>
            <dd className="mt-2 text-sm text-white/90">{profile.onboarding_goal || "Not selected"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
