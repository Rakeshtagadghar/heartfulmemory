import { redirect } from "next/navigation";
import { AppShell } from "../../../../components/app/app-shell";
import { Card } from "../../../../components/ui/card";
import { ButtonLink } from "../../../../components/ui/button";
import { StoryPhotoUploader, type AddPhotoInput } from "../../../../components/photos/StoryPhotoUploader";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../lib/profile";
import { getGuidedStorybookByIdForUser } from "../../../../lib/data/create-flow";
import { createAssetMetadataForUser } from "../../../../lib/data/assets";
import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../../../../lib/convex/ops";

type Props = {
  params: Promise<{ storybookId: string }>;
};

async function listStorybookPhotosForUser(viewerSubject: string, storybookId: string) {
  if (!getConvexUrl()) return { ok: false as const, error: "Convex is not configured." };
  const result = await convexQuery<Array<{
    id: string;
    orderIndex: number;
    assetId: string;
    sourceUrl: string | null;
    width: number | null;
    height: number | null;
    mimeType: string | null;
    createdAt: number;
  }>>(anyApi.storybookPhotos.listPhotos, { viewerSubject, storybookId });
  return result;
}

export default async function PhotosPage({ params }: Props) {
  const { storybookId } = await params;
  const user = await requireAuthenticatedUser(`/book/${storybookId}/photos`);
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const [storybookResult, photosResult] = await Promise.all([
    getGuidedStorybookByIdForUser(user.id, storybookId),
    listStorybookPhotosForUser(user.id, storybookId)
  ]);

  if (!storybookResult.ok) {
    return (
      <AppShell email={user.email} profile={profile}>
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <Card className="p-6">
            <p className="text-sm text-rose-100">Could not load storybook: {storybookResult.error}</p>
            <div className="mt-4">
              <ButtonLink href={`/book/${storybookId}/chapters`} variant="secondary">
                Back to Chapters
              </ButtonLink>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  const initialPhotos = photosResult.ok
    ? photosResult.data.map((p) => ({ id: p.id, orderIndex: p.orderIndex, sourceUrl: p.sourceUrl }))
    : [];

  async function addPhotoAction(input: AddPhotoInput) {
    "use server";
    const currentUser = await requireAuthenticatedUser(`/book/${storybookId}/photos`);

    // 1. Create the asset record (appears in Studio uploads panel)
    const assetResult = await createAssetMetadataForUser(currentUser.id, {
      source: "UPLOAD",
      source_url: input.sourceUrl,
      storage_provider: input.storageKey ? "R2" : "LOCAL_DEV",
      storage_bucket: process.env.R2_BUCKET ?? null,
      storage_key: input.storageKey,
      mime_type: input.mimeType,
      width: input.width,
      height: input.height,
      size_bytes: input.sizeBytes
    });
    if (!assetResult.ok) {
      return { ok: false as const, error: assetResult.error };
    }

    // 2. Link asset to storybook as a story photo
    if (!getConvexUrl()) return { ok: false as const, error: "Convex is not configured." };
    const photoResult = await convexMutation<{ ok: boolean; id: string; orderIndex: number }>(
      anyApi.storybookPhotos.addPhoto,
      { viewerSubject: currentUser.id, storybookId, assetId: assetResult.data.id }
    );
    if (!photoResult.ok) {
      return { ok: false as const, error: (photoResult as any).error ?? "Could not save photo." };
    }
    return photoResult.data;
  }

  async function removePhotoAction(photoId: string) {
    "use server";
    const currentUser = await requireAuthenticatedUser(`/book/${storybookId}/photos`);
    if (!getConvexUrl()) return { ok: false as const };
    const result = await convexMutation<{ ok: boolean }>(anyApi.storybookPhotos.removePhoto, {
      viewerSubject: currentUser.id,
      storybookId,
      photoId
    });
    return result.ok ? { ok: true as const } : { ok: false as const };
  }

  async function continueAction() {
    "use server";
    const currentUser = await requireAuthenticatedUser(`/book/${storybookId}/photos`);
    // Mark photo step as done and flow as populating, then populate
    if (getConvexUrl()) {
      await convexMutation(anyApi.storybooks.setPhotoStatus, {
        viewerSubject: currentUser.id,
        storybookId,
        photoStatus: "done"
      });
      await convexMutation(anyApi.storybooks.setFlowStatus, {
        viewerSubject: currentUser.id,
        storybookId,
        flowStatus: "populating"
      });
    }
    redirect(`/book/${storybookId}/populate`);
  }

  async function skipAction() {
    "use server";
    const currentUser = await requireAuthenticatedUser(`/book/${storybookId}/photos`);
    if (getConvexUrl()) {
      await convexMutation(anyApi.storybooks.setPhotoStatus, {
        viewerSubject: currentUser.id,
        storybookId,
        photoStatus: "skipped"
      });
      await convexMutation(anyApi.storybooks.setFlowStatus, {
        viewerSubject: currentUser.id,
        storybookId,
        flowStatus: "populating"
      });
    }
    redirect(`/book/${storybookId}/populate`);
  }

  return (
    <AppShell email={user.email} profile={profile}>
      <StoryPhotoUploader
        storybookId={storybookId}
        initialPhotos={initialPhotos}
        addPhotoAction={addPhotoAction}
        removePhotoAction={removePhotoAction}
        continueAction={continueAction}
        skipAction={skipAction}
      />
    </AppShell>
  );
}
