import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ButtonLink } from "../ui/button";
import { TrackedLink } from "../tracked-link";
import { OpenInStudioButton } from "./OpenInStudioButton";
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
  const requiredQuestions = typeof progress?.requiredQuestions === "number" ? progress.requiredQuestions : totalQuestions;
  const readyForNextStep = requiredQuestions > 0 ? answeredCount >= requiredQuestions : chapter.status === "completed";
  const nextStepCopy = chapter.status === "completed"
    ? "Next: Generate or review draft, then review illustrations, then open in Studio."
    : "Next: Finish answers, then generate your draft.";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusBadgeClass(chapter.status)}>{statusLabel(chapter.status)}</Badge>
          </div>
          <h3 className="text-lg font-semibold text-parchment">{chapter.title}</h3>
          <p className="text-sm text-white/65">
            Progress: {answeredCount}/{totalQuestions}
            {typeof progress?.requiredQuestions === "number" ? ` / Required ${progress.requiredQuestions}` : ""}
          </p>
          {readyForNextStep ? (
            <p className="text-xs font-medium text-cyan-100/85">{nextStepCopy}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <ButtonLink
            href={`/book/${storybookId}/chapters/${chapter.id}/wizard`}
            variant={chapter.status === "completed" ? "secondary" : "primary"}
          >
            {ctaLabel}
          </ButtonLink>

          {chapter.status === "completed" ? (
            <div className="flex items-center gap-2 sm:justify-end">
              <TrackedLink
                href={`/book/${storybookId}/chapters/${chapter.id}/draft`}
                eventName="draft_review_open"
                eventProps={{ chapterKey: chapter.chapterKey }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-gold transition hover:bg-white/[0.08] hover:text-[#e6c77f]"
                aria-label="Review Draft"
                title="Review Draft"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 4h9l3 3v13H6z" />
                  <path d="M9 9h6" />
                  <path d="M9 13h6" />
                  <path d="M9 17h4" />
                </svg>
              </TrackedLink>
              <TrackedLink
                href={`/book/${storybookId}/chapters/${chapter.id}/illustrations`}
                eventName="illustrations_review_open"
                eventProps={{ chapterKey: chapter.chapterKey }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Review Illustrations"
                title="Review Illustrations"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <circle cx="9" cy="10" r="1.5" />
                  <path d="m7 16 3.5-3.5L13 15l2.5-2.5L18 16" />
                </svg>
              </TrackedLink>
              <OpenInStudioButton
                href={`/studio/${storybookId}?chapter=${chapter.id}`}
                chapterKey={chapter.chapterKey}
                iconOnly
                ariaLabel="Open in Studio"
              />
            </div>
          ) : (
            <span className="text-xs text-white/35">Complete chapter to open in Studio</span>
          )}
        </div>
      </div>
    </Card>
  );
}

