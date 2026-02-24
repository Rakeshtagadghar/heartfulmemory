import { redirect } from "next/navigation";
import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { EditorShell } from "../../../../components/editor/EditorShell";
import { getOrCreateProfileForUser } from "../../../../lib/profile";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getStorybookForUser } from "../../../../lib/data/storybooks";
import { listChaptersByStorybookForUser } from "../../../../lib/data/chapters";
import { listChapterBlocksForUser } from "../../../../lib/data/blocks";

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

export default async function StorybookPage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(`/app/storybooks/${id}`);
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const storybook = await getStorybookForUser(user.id, id);
  if (!storybook.ok) {
    return (
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Storybook</p>
        <h1 className="mt-2 font-display text-3xl text-parchment">Unable to load storybook</h1>
        <p className="mt-3 text-sm leading-7 text-rose-100">{storybook.error}</p>
      </Card>
    );
  }

  const chapters = await listChaptersByStorybookForUser(user.id, id);
  const initialChapterId = chapters.ok ? chapters.data[0]?.id : undefined;
  const initialBlocks =
    chapters.ok && initialChapterId
      ? await listChapterBlocksForUser(user.id, initialChapterId)
      : { ok: true as const, data: [] };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Storybook</p>
            <h1 className="mt-2 font-display text-4xl text-parchment">{storybook.data.title}</h1>
            {storybook.data.subtitle ? (
              <p className="mt-2 text-sm text-white/70">{storybook.data.subtitle}</p>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-white/70">
              Manage chapter order, write in rich text blocks, add image placeholders, and rely on autosave with conflict-safe version checks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/15 bg-white/[0.03] text-white/80">{storybook.data.status}</Badge>
            <Badge className="border-white/15 bg-white/[0.03] text-white/80">{storybook.data.book_mode}</Badge>
          </div>
        </div>
      </Card>

      {chapters.ok ? (
        <EditorShell
          initialStorybook={storybook.data}
          initialChapters={chapters.data}
          initialBlocksByChapterId={initialChapterId && initialBlocks.ok ? { [initialChapterId]: initialBlocks.data } : {}}
          createdEvent={
            getSearchString(resolvedSearchParams, "created")
              ? {
                  source: getSearchString(resolvedSearchParams, "source"),
                  template_id: getSearchString(resolvedSearchParams, "templateId"),
                  template_version: Number.parseInt(
                    getSearchString(resolvedSearchParams, "templateVersion") ?? "",
                    10
                  ) || undefined
                }
              : null
          }
        />
      ) : (
        <Card className="p-5">
          <p className="text-sm text-rose-100">Could not load chapters: {chapters.error}</p>
        </Card>
      )}
    </div>
  );
}
