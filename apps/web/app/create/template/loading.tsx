import { AppShell } from "../../../components/app/app-shell";
import { Card } from "../../../components/ui/card";
import { requireAuthenticatedUser } from "../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../lib/profile";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} aria-hidden />;
}

export default async function CreateTemplateLoading() {
  const user = await requireAuthenticatedUser("/create/template");
  const profile = await getOrCreateProfileForUser(user);

  return (
    <AppShell email={user.email} profile={profile}>
      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-9 w-80 max-w-full" />
            <SkeletonBlock className="h-4 w-full max-w-2xl" />
            <SkeletonBlock className="h-4 w-4/5 max-w-xl" />
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="p-5 sm:p-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <SkeletonBlock className="h-7 w-32 rounded-full" />
                  <SkeletonBlock className="h-7 w-12 rounded-full" />
                </div>
                <div className="space-y-2">
                  <SkeletonBlock className="h-7 w-52" />
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-11/12" />
                </div>
                <div className="rounded-2xl border border-white/10 p-4">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-24" />
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-10 w-full" />
                  </div>
                </div>
                <SkeletonBlock className="h-12 w-full rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
