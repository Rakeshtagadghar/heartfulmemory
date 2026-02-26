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

export default async function StorybookLayoutPage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
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
    <div className="space-y-4">
      {getSearchString(resolvedSearchParams, "chapter") ? (
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gold/75">Guided Chapter Context</p>
          <p className="mt-2 text-sm text-white/75">
            Chapter context is attached to this Studio session (populate hook stub for a later sprint).
          </p>
        </Card>
      ) : null}
      <Editor2Shell
        storybook={storybook.data}
        initialPages={pages.data}
        initialFramesByPageId={framesByPageId}
        fullscreen
      />
    </div>
  );
}
