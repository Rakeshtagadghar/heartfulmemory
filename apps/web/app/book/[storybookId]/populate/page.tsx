import { redirect } from "next/navigation";
import { AppShell } from "../../../../components/app/app-shell";
import { Card } from "../../../../components/ui/card";
import { ButtonLink } from "../../../../components/ui/button";
import { PopulateProgress } from "../../../../components/photos/PopulateProgress";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../lib/profile";
import { anyApi, convexAction, convexMutation, getConvexUrl } from "../../../../lib/convex/ops";

type Props = {
  params: Promise<{ storybookId: string }>;
};

export default async function PopulatePage({ params }: Props) {
  const { storybookId } = await params;
  const user = await requireAuthenticatedUser(`/book/${storybookId}/populate`);
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  if (!getConvexUrl()) {
    return (
      <AppShell email={user.email} profile={profile}>
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Card className="p-6">
            <p className="text-sm text-rose-100">Convex is not configured.</p>
            <div className="mt-4">
              <ButtonLink href={`/book/${storybookId}/photos`} variant="secondary">Back</ButtonLink>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  const result = await convexAction<{ ok: boolean; errorCode?: string; message?: string; firstPageId?: string | null }>(
    anyApi.studioPopulateFromPhotos.populateFromPhotos,
    { viewerSubject: user.id, storybookId }
  );

  if (!result.ok || !result.data.ok) {
    const errMsg = result.ok ? (result.data.message ?? "Population failed") : (result.error ?? "Population failed");
    // Set error status
    await convexMutation(anyApi.storybooks.setFlowStatus, {
      viewerSubject: user.id,
      storybookId,
      flowStatus: "error"
    }).catch(() => undefined);

    return (
      <AppShell email={user.email} profile={profile}>
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Card className="p-6 space-y-4">
            <PopulateProgress error={errMsg} />
            <ButtonLink href={`/book/${storybookId}/photos`} variant="secondary">
              Back to Photos
            </ButtonLink>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Success — redirect to Studio
  const firstPageId = result.data.firstPageId;
  const studioHref = firstPageId
    ? `/studio/${storybookId}?page=${encodeURIComponent(firstPageId)}`
    : `/studio/${storybookId}`;

  redirect(studioHref);
}
