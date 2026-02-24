import { redirect } from "next/navigation";
import { Card } from "../../../../../components/ui/card";
import { Editor2Shell } from "../../../../../components/editor2/EditorShell";
import { getOrCreateProfileForUser } from "../../../../../lib/profile";
import { requireAuthenticatedUser } from "../../../../../lib/auth/server";
import { getStorybookForUser } from "../../../../../lib/data/storybooks";
import { createDefaultCanvasForUser, listPagesByStorybookForUser } from "../../../../../lib/data/pages";
import { listFramesByStorybookForUser } from "../../../../../lib/data/frames";
import type { FrameDTO } from "../../../../../lib/dto/frame";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StorybookLayoutPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuthenticatedUser(`/app/storybooks/${id}/layout`);
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const storybook = await getStorybookForUser(user.id, id);
  if (!storybook.ok) {
    return (
      <Card className="p-6">
        <h1 className="font-display text-3xl text-parchment">Layout Studio unavailable</h1>
        <p className="mt-3 text-sm text-rose-100">{storybook.error}</p>
      </Card>
    );
  }

  let pages = await listPagesByStorybookForUser(user.id, id);
  if (pages.ok && pages.data.length === 0) {
    const seeded = await createDefaultCanvasForUser(user.id, id);
    if (seeded.ok) {
      pages = seeded;
    }
  }
  const frames = await listFramesByStorybookForUser(user.id, id);

  if (!pages.ok) {
    return (
      <Card className="p-6">
        <h1 className="font-display text-3xl text-parchment">Could not load pages</h1>
        <p className="mt-3 text-sm text-rose-100">{pages.error}</p>
      </Card>
    );
  }
  if (!frames.ok) {
    return (
      <Card className="p-6">
        <h1 className="font-display text-3xl text-parchment">Could not load frames</h1>
        <p className="mt-3 text-sm text-rose-100">{frames.error}</p>
      </Card>
    );
  }

  const framesByPageId: Record<string, FrameDTO[]> = {};
  for (const page of pages.data) {
    framesByPageId[page.id] = [];
  }
  for (const frame of frames.data) {
    let pageFrames = framesByPageId[frame.page_id];
    if (!pageFrames) {
      pageFrames = [];
      framesByPageId[frame.page_id] = pageFrames;
    }
    pageFrames.push(frame);
  }

  return (
    <Editor2Shell
      storybook={storybook.data}
      initialPages={pages.data}
      initialFramesByPageId={framesByPageId}
      fullscreen
    />
  );
}
