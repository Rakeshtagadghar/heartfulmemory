import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
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
  chapter,
  progress
}: {
  chapter: GuidedChapterInstance;
  progress?: GuidedChapterProgress;
}) {
  const totalQuestions = progress?.totalQuestions ?? 0;
  const answeredCount = progress?.answeredCount ?? 0;
  const requiredQuestions = typeof progress?.requiredQuestions === "number" ? progress.requiredQuestions : totalQuestions;
  const isComplete = chapter.status === "completed";
  const readyForNextStep = requiredQuestions > 0 ? answeredCount >= requiredQuestions : isComplete;

  return (
    <Card className="p-4 sm:p-5">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusBadgeClass(chapter.status)}>{statusLabel(chapter.status)}</Badge>
        </div>
        <h3 className="text-lg font-semibold text-parchment">{chapter.title}</h3>
        <p className="text-sm text-white/65">
          Progress: {answeredCount}/{totalQuestions}
          {typeof progress?.requiredQuestions === "number" ? ` / Required ${progress.requiredQuestions}` : ""}
        </p>
        {readyForNextStep && isComplete ? (
          <p className="text-xs font-medium text-emerald-100/85">Chapter complete</p>
        ) : null}
      </div>
    </Card>
  );
}
