import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../../../components/app/app-shell";
import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { ChapterCard } from "../../../../components/chapters/ChapterCard";
import { ContinueYourStoryButton } from "../../../../components/chapters/ContinueYourStoryButton";
import { NarrationSettingsPanel } from "../../../../components/story/NarrationSettingsPanel";
import { ViewportEvent } from "../../../../components/viewport-event";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../lib/profile";
import {
  getGuidedChapterProgressByStorybookForUser,
  getGuidedStorybookByIdForUser,
  listGuidedChaptersByStorybookForUser,
  updateGuidedNarrationForUser
} from "../../../../lib/data/create-flow";
import { deriveNextStep } from "../../../../lib/flow/deriveNextStep";
import type { ExtraAnswerStatus, FlowStateKind, PhotoStatus } from "../../../../../../packages/shared/flow/flowTypes";

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

function readNarrationFormValue(formData: FormData) {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  const voice: "first_person" | "third_person" = read("voice") === "first_person" ? "first_person" : "third_person";
  const tense: "past" | "present" = read("tense") === "present" ? "present" : "past";

  let tone: "warm" | "formal" | "playful" | "poetic" = "warm";
  const rawTone = read("tone");
  if (rawTone === "formal" || rawTone === "playful" || rawTone === "poetic") {
    tone = rawTone;
  }

  let length: "short" | "medium" | "long" = "medium";
  const rawLength = read("length");
  if (rawLength === "short" || rawLength === "long") {
    length = rawLength;
  }

  return { voice, tense, tone, length };
}

export default async function GuidedChapterListPage({ params, searchParams }: Props) { // NOSONAR
  const { storybookId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(`/book/${storybookId}/chapters`);
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  function renderInAppShell(content: ReactNode) {
    return (
      <AppShell email={user.email} profile={profile}>
        {content}
      </AppShell>
    );
  }

  const [storybook, chapters, progress] = await Promise.all([
    getGuidedStorybookByIdForUser(user.id, storybookId),
    listGuidedChaptersByStorybookForUser(user.id, storybookId),
    getGuidedChapterProgressByStorybookForUser(user.id, storybookId)
  ]);

  if (!storybook.ok) {
    return renderInAppShell(
      <Card className="p-6">
        <p className="text-sm text-rose-100">Could not load storybook: {storybook.error}</p>
      </Card>
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

    const result = await updateGuidedNarrationForUser(currentUser.id, storybookId, readNarrationFormValue(formData));

    if (!result.ok) {
      redirect(`/book/${storybookId}/chapters?narrationError=1`);
    }

    redirect(`/book/${storybookId}/chapters?narrationSaved=1`);
  }

  const isFreeformStory = storybook.data.templateId == null;
  const chaptersLoadError = chapters.ok ? null : chapters.error;
  const progressWarning = progress.ok ? null : progress.error;

  const extraAnswerStatus: ExtraAnswerStatus = (() => {
    if (!storybook.data.extraAnswer) return "pending";
    return storybook.data.extraAnswer.skipped ? "skipped" : "answered";
  })();
  const photoStatus: PhotoStatus = (storybook.data.photoStatus as PhotoStatus | null) ?? "not_started";
  const flowStatus: FlowStateKind | null = (() => {
    const value = storybook.data.flowStatus;
    if (
      value === "needs_questions" ||
      value === "needs_extra_question" ||
      value === "needs_upload_photos" ||
      value === "populating" ||
      value === "ready_in_studio" ||
      value === "error"
    ) {
      return value;
    }
    return null;
  })();
  const nextStep = deriveNextStep({
    storybookId,
    chapters: chaptersData,
    extraAnswerStatus,
    photoStatus,
    flowStatus
  });

  const nextStepHint: string | null = (() => {
    if (nextStep.state === "needs_questions" && "chapterInstanceId" in nextStep) {
      const ch = chaptersData.find((c) => c.id === nextStep.chapterInstanceId);
      return ch ? `Next: ${ch.title}` : null;
    }
    if (nextStep.state === "needs_extra_question") return "Next: Final question";
    if (nextStep.state === "needs_upload_photos") return "Next: Upload your photos";
    if (nextStep.state === "ready_in_studio") return "Next: Open Studio";
    if (nextStep.state === "populating") return "Preparing your studio…";
    return null;
  })();

  let chaptersContent: ReactNode;
  if (chaptersLoadError) {
    chaptersContent = (
      <Card className="p-6">
        <p className="text-sm text-rose-100">Could not load chapters: {chaptersLoadError}</p>
      </Card>
    );
  } else if (chaptersData.length === 0) {
    chaptersContent = (
      <Card className="p-6">
        <p className="text-sm text-white/75">No guided chapters found yet.</p>
      </Card>
    );
  } else {
    chaptersContent = (
      <div className="grid gap-4">
        {chaptersData.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            progress={progressByChapterId.get(chapter.id)}
          />
        ))}
      </div>
    );
  }

  return renderInAppShell(
    <div className="space-y-6">
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
                {storybook.data.templateSubtitle ? ` / ${storybook.data.templateSubtitle}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/15 bg-white/[0.03] text-white/80">{storybook.data.status}</Badge>
              <ContinueYourStoryButton
                href={nextStep.href ?? null}
                hint={nextStepHint}
                disabled={nextStep.state === "populating"}
              />
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

          {completedChapter ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-sm font-semibold text-emerald-100">
                Chapter completed: {completedChapter.title}
              </p>
            </div>
          ) : null}

          <div className="mt-6 border-t border-white/10 pt-6">
            <NarrationSettingsPanel
              narration={storybook.data.narration}
              action={saveNarrationSettings}
              subtitle="Choose how your drafts sound. Changes apply the next time you generate or regenerate a chapter draft."
              embedded
              narrationSaved={narrationSaved}
            />
          </div>
        </div>
      </Card>

      {getSearchString(resolvedSearchParams, "narrationError") === "1" ? (
        <Card className="p-4">
          <p className="text-sm text-rose-100">Could not save narration settings.</p>
        </Card>
      ) : null}

      {isFreeformStory ? (
        <Card className="p-4">
          <p className="text-sm text-white/75">
            Freeform mode is active. Add-more-chapters UI is planned next; Chapter 1 is ready now.
          </p>
        </Card>
      ) : null}

      {chaptersContent}

      {progressWarning ? (
        <Card className="p-4">
          <p className="text-xs text-white/55">Progress query warning: {progressWarning}</p>
        </Card>
      ) : null}
    </div>
  );
}
