import { Card } from "../ui/card";
import type { GuidedTemplateQuestion } from "../../../../packages/shared/templates/templateTypes";

type CurrentAnswer = {
  answerText: string | null;
  skipped: boolean;
};

export function QuestionStep({
  question,
  stepIndex,
  totalSteps,
  currentAnswer
}: {
  question: GuidedTemplateQuestion;
  stepIndex: number;
  totalSteps: number;
  currentAnswer: CurrentAnswer | null;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            Question {stepIndex + 1} of {totalSteps}
          </span>
          {question.required ? (
            <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
              Required
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Optional
            </span>
          )}
          {currentAnswer?.skipped ? (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Skipped
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="text-2xl font-semibold leading-tight text-parchment sm:text-3xl">
            {question.prompt}
          </h2>
          {question.helpText ? (
            <p className="mt-3 text-sm leading-7 text-white/70">{question.helpText}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/85">Your answer</span>
            <textarea
              name="answerText"
              defaultValue={currentAnswer?.answerText ?? ""}
              rows={7}
              className="w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 text-base leading-7 text-white outline-none placeholder:text-white/35 focus:border-gold/45"
              placeholder="Type your memory here..."
            />
          </label>

          <button
            type="button"
            disabled
            className="inline-flex h-11 items-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/45"
            title="Voice capture arrives in a later sprint"
          >
            Voice (Coming Soon)
          </button>
        </div>
      </div>
    </Card>
  );
}

