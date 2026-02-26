import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ButtonLink } from "../ui/button";
import { TrackedLink } from "../tracked-link";
import type { GuidedChapterInstance, GuidedChapterProgress } from "../../lib/data/create-flow";

function statusLabel(status: GuidedChapterInstance["status"]) {
  if (status === "completed") return "Done";
  if (status === "in_progress") return "In Progress";
  return "Not Started";
}

function statusBadgeClass(status: GuidedChapterInstance["status"]) {
  if (status === "completed") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (status === "in_progress") return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  return "border-white/15 bg-white/[0.03] text-white/75";
}

export function ChapterCard({
  storybookId,
  chapter,
  progress
}: {
  storybookId: string;
  chapter: GuidedChapterInstance;
  progress?: GuidedChapterProgress;
}) {
  const ctaLabel =
    chapter.status === "completed" ? "Review" : chapter.status === "in_progress" ? "Resume" : "Start";

  const totalQuestions = progress?.totalQuestions ?? 0;
  const answeredCount = progress?.answeredCount ?? 0;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusBadgeClass(chapter.status)}>{statusLabel(chapter.status)}</Badge>
            <span className="text-xs uppercase tracking-[0.14em] text-white/40">{chapter.chapterKey}</span>
          </div>
          <h3 className="text-lg font-semibold text-parchment">{chapter.title}</h3>
          <p className="text-sm text-white/65">
            Progress: {answeredCount}/{totalQuestions}
            {typeof progress?.requiredQuestions === "number" ? ` / Required ${progress.requiredQuestions}` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <ButtonLink
            href={`/book/${storybookId}/chapters/${chapter.id}/wizard`}
            variant={chapter.status === "completed" ? "secondary" : "primary"}
          >
            {ctaLabel}
          </ButtonLink>

          {chapter.status === "completed" ? (
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <TrackedLink
                href={`/book/${storybookId}/chapters/${chapter.id}/draft`}
                eventName="draft_review_open"
                eventProps={{ chapterKey: chapter.chapterKey }}
                className="text-xs font-semibold text-gold hover:text-[#e6c77f]"
              >
                Review Draft
              </TrackedLink>
              <TrackedLink
                href={`/book/${storybookId}/chapters/${chapter.id}/illustrations`}
                eventName="illustrations_review_open"
                eventProps={{ chapterKey: chapter.chapterKey }}
                className="text-xs font-semibold text-white/80 hover:text-white"
              >
                Review Illustrations
              </TrackedLink>
              <TrackedLink
                href={`/studio/${storybookId}?chapter=${chapter.id}`}
                eventName="open_studio_from_chapter"
                eventProps={{ chapterKey: chapter.chapterKey }}
                className="text-xs font-semibold text-cyan-100 hover:text-cyan-50"
              >
                Open in Studio
              </TrackedLink>
            </div>
          ) : (
            <span className="text-xs text-white/35">Complete chapter to open in Studio</span>
          )}
        </div>
      </div>
    </Card>
  );
}

