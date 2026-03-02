"use server";

import { redirect } from "next/navigation";
import { AppShell } from "../../../../components/app/app-shell";
import { Card } from "../../../../components/ui/card";
import { ButtonLink } from "../../../../components/ui/button";
import { ExtraQuestionStep } from "../../../../components/wizard/ExtraQuestionStep";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../lib/profile";
import { getGuidedStorybookByIdForUser, setExtraAnswerForUser } from "../../../../lib/data/create-flow";

type Props = {
  params: Promise<{ storybookId: string }>;
};

export default async function ExtraQuestionPage({ params }: Props) {
  const { storybookId } = await params;
  const user = await requireAuthenticatedUser(`/book/${storybookId}/extra`);
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const storybookResult = await getGuidedStorybookByIdForUser(user.id, storybookId);
  if (!storybookResult.ok) {
    return (
      <AppShell email={user.email} profile={profile}>
        <Card className="p-6">
          <p className="text-sm text-rose-100">Could not load storybook: {storybookResult.error}</p>
          <div className="mt-4">
            <ButtonLink href={`/book/${storybookId}/chapters`} variant="secondary">
              Back to Chapters
            </ButtonLink>
          </div>
        </Card>
      </AppShell>
    );
  }

  async function saveExtra(text: string) {
    "use server";
    const currentUser = await requireAuthenticatedUser(`/book/${storybookId}/extra`);
    await setExtraAnswerForUser(currentUser.id, storybookId, { text, skipped: false });
    redirect(`/book/${storybookId}/photos`);
  }

  async function skipExtra() {
    "use server";
    const currentUser = await requireAuthenticatedUser(`/book/${storybookId}/extra`);
    await setExtraAnswerForUser(currentUser.id, storybookId, { text: null, skipped: true });
    redirect(`/book/${storybookId}/photos`);
  }

  return (
    <AppShell email={user.email} profile={profile}>
      <ExtraQuestionStep
        storybookId={storybookId}
        storybookTitle={storybookResult.data.title}
        defaultText={storybookResult.data.extraAnswer?.text ?? null}
        saveAction={saveExtra}
        skipAction={skipExtra}
      />
    </AppShell>
  );
}
