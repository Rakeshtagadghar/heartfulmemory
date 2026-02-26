import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { ChapterCard } from "../../../../components/chapters/ChapterCard";
import { NarrationSettingsPanel } from "../../../../components/story/NarrationSettingsPanel";
import { TrackedLink } from "../../../../components/tracked-link";
import { ViewportEvent } from "../../../../components/viewport-event";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../lib/profile";
import {
  getGuidedChapterProgressByStorybookForUser,
  getGuidedStorybookByIdForUser,
  listGuidedChaptersByStorybookForUser,
  updateGuidedNarrationForUser
} from "../../../../lib/data/create-flow";

type Props = {
  params: Promise<{ storybookId: string }>;
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

export default async function GuidedChapterListPage({ params, searchParams }: Props) {
  const { storybookId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(`/book/${storybookId}/chapters`);
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const [storybook, chapters, progress] = await Promise.all([
    getGuidedStorybookByIdForUser(user.id, storybookId),
    listGuidedChaptersByStorybookForUser(user.id, storybookId),
    getGuidedChapterProgressByStorybookForUser(user.id, storybookId)
  ]);

  if (!storybook.ok) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <p className="text-sm text-rose-100">Could not load storybook: {storybook.error}</p>
        </Card>
      </div>
    );
  }

  const chaptersData = chapters.ok ? chapters.data : [];
  const progressRows = progress.ok ? progress.data : [];
  const progressByChapterId = new Map(progressRows.map((row) => [row.chapterInstanceId, row] as const));

  const totalChapters = chaptersData.length;
  const completedCount = chaptersData.filter((chapter) => chapter.status === "completed").length;
  const inProgressCount = chaptersData.filter((chapter) => chapter.status === "in_progress").length;
  const notStartedCount = chaptersData.filter((chapter) => chapter.status === "not_started").length;
  const totalQuestions = progressRows.reduce((sum, row) => sum + row.totalQuestions, 0);
  const answeredQuestions = progressRows.reduce((sum, row) => sum + row.answeredCount, 0);
  const chapterCompletionPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  const chapterCompletedId = getSearchString(resolvedSearchParams, "chapterCompleted");
  const narrationSaved = getSearchString(resolvedSearchParams, "narrationSaved") === "1";
  const completedChapter = chapterCompletedId
    ? chaptersData.find((chapter) => chapter.id === chapterCompletedId) ?? null
    : null;

  async function saveNarrationSettings(formData: FormData) {
    "use server";
    const currentUser = await requireAuthenticatedUser(`/book/${storybookId}/chapters`);
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) {
      redirect("/app/onboarding");
    }

    const read = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : "";
    };

    const result = await updateGuidedNarrationForUser(currentUser.id, storybookId, {
      voice: read("voice") === "first_person" ? "first_person" : "third_person",
      tense: read("tense") === "present" ? "present" : "past",
      tone:
        read("tone") === "formal" || read("tone") === "playful" || read("tone") === "poetic"
          ? (read("tone") as "formal" | "playful" | "poetic")
          : "warm",
      length:
        read("length") === "short" || read("length") === "long"
          ? (read("length") as "short" | "long")
          : "medium"
    });

    if (!result.ok) {
      redirect(`/book/${storybookId}/chapters?narrationError=1`);
    }

    redirect(`/book/${storybookId}/chapters?narrationSaved=1`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <ViewportEvent eventName="chapters_view" eventProps={{ storybookId }} />
      {completedChapter ? (
        <ViewportEvent eventName="chapter_complete" eventProps={{ chapterKey: completedChapter.chapterKey }} />
      ) : null}

      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_15%_20%,rgba(213,179,106,0.5),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(120,220,210,0.35),transparent_38%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Guided Chapters</p>
              <h1 className="mt-2 font-display text-3xl text-parchment sm:text-4xl">{storybook.data.title}</h1>
              <p className="mt-2 text-sm text-white/70">
                {storybook.data.templateTitle ?? "Freeform story"}
                {storybook.data.templateSubtitle ? ` • ${storybook.data.templateSubtitle}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/15 bg-white/[0.03] text-white/80">{storybook.data.status}</Badge>
              <Link
                href={`/app/storybooks/${storybookId}`}
                className="inline-flex h-10 items-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/15"
              >
                Open Studio
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">Chapters Done</p>
              <p className="mt-2 text-2xl font-semibold text-parchment">
                {completedCount}/{totalChapters}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">In Progress</p>
              <p className="mt-2 text-2xl font-semibold text-parchment">{inProgressCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">Not Started</p>
              <p className="mt-2 text-2xl font-semibold text-parchment">{notStartedCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">Answers Saved</p>
              <p className="mt-2 text-2xl font-semibold text-parchment">
                {answeredQuestions}/{totalQuestions}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#d5b36a,#9fe1d8)] motion-reduce:transition-none"
                style={{ width: `${chapterCompletionPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/55">Chapter completion: {chapterCompletionPercent}%</p>
          </div>
        </div>
      </Card>

      {completedChapter ? (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100">
                Chapter completed: {completedChapter.title}
              </p>
              <p className="text-xs text-white/60">
                Continue into Studio now or keep filling out other chapters.
              </p>
            </div>
            <TrackedLink
              href={`/studio/${storybookId}?chapter=${completedChapter.id}`}
              eventName="open_studio_from_chapter"
              eventProps={{ chapterKey: completedChapter.chapterKey }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/15"
            >
              Open in Studio
            </TrackedLink>
          </div>
        </Card>
      ) : null}

      {narrationSaved ? (
        <Card className="p-4">
          <p className="text-sm text-emerald-100">Narration settings saved.</p>
        </Card>
      ) : null}
      {getSearchString(resolvedSearchParams, "narrationError") === "1" ? (
        <Card className="p-4">
          <p className="text-sm text-rose-100">Could not save narration settings.</p>
        </Card>
      ) : null}

      <NarrationSettingsPanel
        narration={storybook.data.narration}
        action={saveNarrationSettings}
        subtitle="These settings are applied when generating chapter drafts in Sprint 19."
      />

      {!storybook.data.templateId ? (
        <Card className="p-4">
          <p className="text-sm text-white/75">
            Freeform mode is active. Add-more-chapters UI is planned next; Chapter 1 is ready now.
          </p>
        </Card>
      ) : null}

      {!chapters.ok ? (
        <Card className="p-6">
          <p className="text-sm text-rose-100">Could not load chapters: {chapters.error}</p>
        </Card>
      ) : chaptersData.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-white/75">No guided chapters found yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {chaptersData.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              storybookId={storybookId}
              chapter={chapter}
              progress={progressByChapterId.get(chapter.id)}
            />
          ))}
        </div>
      )}

      {!progress.ok ? (
        <Card className="p-4">
          <p className="text-xs text-white/55">Progress query warning: {progress.error}</p>
        </Card>
      ) : null}
    </div>
  );
}

