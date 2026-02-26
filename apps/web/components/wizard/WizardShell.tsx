import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { WizardActionButton } from "./WizardActionButton";

export function WizardShell({
  storyTitle,
  chapterTitle,
  stepIndex,
  totalSteps,
  answeredCount,
  notice,
  error,
  canGoBack,
  isLastStep,
  currentQuestionId,
  chaptersHref,
  children
}: {
  storyTitle: string;
  chapterTitle: string;
  stepIndex: number;
  totalSteps: number;
  answeredCount: number;
  notice?: string | null;
  error?: string | null;
  canGoBack: boolean;
  isLastStep: boolean;
  currentQuestionId: string;
  chaptersHref: string;
  children: ReactNode;
}) {
  const progressPercent = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Chapter Wizard</p>
            <h1 className="mt-2 font-display text-2xl text-parchment sm:text-3xl">{chapterTitle}</h1>
            <p className="mt-2 text-sm text-white/65">{storyTitle}</p>
            <Link
              href={chaptersHref}
              className="mt-3 inline-flex items-center text-xs font-semibold uppercase tracking-[0.14em] text-white/50 hover:text-white/75"
            >
              Back to chapter list
            </Link>
          </div>
          <div className="text-right text-sm text-white/60">
            <p>Step {stepIndex + 1} of {totalSteps}</p>
            <p>Answered: {answeredCount}/{totalSteps}</p>
          </div>
        </div>

        <div className="mt-4 h-2 rounded-full bg-white/[0.05]">
            <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#d5b36a,#9fe1d8)] transition-all motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {notice ? (
          <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
      </Card>

      {children}

      <Card className="sticky bottom-3 z-10 p-4 backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              name="intent"
              value="back"
              form="chapter-wizard-form"
              variant="ghost"
              size="lg"
              disabled={!canGoBack}
            >
              Back
            </Button>
            <Button
              type="submit"
              name="intent"
              value="save"
              form="chapter-wizard-form"
              variant="secondary"
              size="lg"
            >
              Save
            </Button>
            <WizardActionButton
              type="submit"
              name="intent"
              value="skip"
              form="chapter-wizard-form"
              variant="secondary"
              size="lg"
              eventKind="skip"
              questionId={currentQuestionId}
            >
              Skip
            </WizardActionButton>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="."
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/55 hover:bg-white/[0.03]"
            >
              Refresh
            </Link>
            <WizardActionButton
              type="submit"
              name="intent"
              value={isLastStep ? "finish" : "next"}
              form="chapter-wizard-form"
              size="lg"
              eventKind={isLastStep ? "none" : "next"}
              questionId={currentQuestionId}
            >
              {isLastStep ? "Finish Chapter" : "Next"}
            </WizardActionButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
