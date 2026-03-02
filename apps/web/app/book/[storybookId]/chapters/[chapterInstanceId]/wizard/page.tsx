import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../../../../../components/app/app-shell";
import { Card } from "../../../../../../components/ui/card";
import { ButtonLink } from "../../../../../../components/ui/button";
import { WizardShell } from "../../../../../../components/wizard/WizardShell";
import { QuestionStep } from "../../../../../../components/wizard/QuestionStep";
import { ViewportEvent } from "../../../../../../components/viewport-event";
import { requireAuthenticatedUser } from "../../../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../../../lib/profile";
import {
  completeGuidedChapterForUser,
  getGuidedStorybookByIdForUser,
  getGuidedTemplateById,
  listGuidedChapterAnswersForUser,
  listGuidedChaptersByStorybookForUser,
  upsertGuidedChapterAnswerForUser
} from "../../../../../../lib/data/create-flow";
import { getResumeIndex } from "../../../../../../lib/wizard/resumeIndex";
import type { GuidedTemplateQuestion } from "../../../../../../../../packages/shared/templates/templateTypes";

type Props = {
  params: Promise<{ storybookId: string; chapterInstanceId: string }>;
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

function clampIndex(value: number, max: number) {
  if (max <= 0) return 0;
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(0, value), max);
}

function parseStepIndex(raw: string | undefined) {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildWizardUrl(
  storybookId: string,
  chapterInstanceId: string,
  options?: { step?: number; notice?: string; error?: string; questionId?: string }
) {
  const params = new URLSearchParams();
  if (typeof options?.step === "number") params.set("step", String(options.step));
  if (options?.notice) params.set("notice", options.notice);
  if (options?.error) params.set("error", options.error);
  if (options?.questionId) params.set("questionId", options.questionId);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return `/book/${storybookId}/chapters/${chapterInstanceId}/wizard${suffix}`;
}

function getFreeformQuestions(chapterTitle: string): GuidedTemplateQuestion[] {
  return [
    {
      questionId: "q_freeform_story_start",
      prompt: `Tell the story you want to capture in "${chapterTitle}".`,
      helpText:
        "You can start anywhere: a memory, a person, a place, or a moment that matters. Add details in your own words.",
      required: true,
      inputType: "textarea"
    }
  ];
}

function hasMeaningfulAnswer(answer: { answerText?: string | null; answerJson?: unknown; skipped?: boolean } | null) {
  if (!answer) return false;
  if (answer.skipped) return true;
  if (typeof answer.answerText === "string" && answer.answerText.trim().length > 0) return true;
  if (answer.answerJson !== undefined && answer.answerJson !== null) return true;
  return false;
}

function hasAnswerText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function mapNotice(notice: string | undefined) {
  if (!notice) return null;
  if (notice === "saved") return "Answer saved.";
  if (notice === "skipped") return "Question skipped. You can return and edit it anytime.";
  if (notice === "completed") return "Chapter completed.";
  return null;
}

function mapError(error: string | undefined) {
  if (!error) return null;
  if (error === "missing_required") return "Please answer or explicitly skip each question before finishing this chapter.";
  if (error === "answer_or_skip") return "Please answer this question or tap Skip to continue.";
  if (error === "save_failed") return "Could not save your answer. Please try again.";
  if (error === "complete_failed") return "Could not complete this chapter yet. Please try again.";
  return "Something went wrong. Please try again.";
}

function parseSttMetaJson(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.provider !== "groq" && parsed.provider !== "elevenlabs") return null;
    return {
      provider: parsed.provider,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
      durationMs: typeof parsed.durationMs === "number" ? parsed.durationMs : null,
      providerRequestId: typeof parsed.providerRequestId === "string" ? parsed.providerRequestId : null,
      mimeType: typeof parsed.mimeType === "string" ? parsed.mimeType : null,
      bytes: typeof parsed.bytes === "number" ? parsed.bytes : null
    } as const;
  } catch {
    return null;
  }
}

export default async function ChapterWizardPage({ params, searchParams }: Props) { // NOSONAR
  const { storybookId, chapterInstanceId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(`/book/${storybookId}/chapters/${chapterInstanceId}/wizard`);
  const profile = await getOrCreateProfileForUser(user);
  if (profile.onboarding_completed === false) {
    redirect("/app/onboarding");
  }

  function renderInAppShell(content: ReactNode) {
    return (
      <AppShell email={user.email} profile={profile}>
        {content}
      </AppShell>
    );
  }

  const [storybookResult, chaptersResult, answersResult] = await Promise.all([
    getGuidedStorybookByIdForUser(user.id, storybookId),
    listGuidedChaptersByStorybookForUser(user.id, storybookId),
    listGuidedChapterAnswersForUser(user.id, chapterInstanceId)
  ]);

  if (!storybookResult.ok) {
    return renderInAppShell(
      <Card className="p-6">
        <p className="text-sm text-rose-100">Could not load storybook: {storybookResult.error}</p>
        <div className="mt-4">
          <ButtonLink href={`/book/${storybookId}/chapters`} variant="secondary">
            Back to Chapters
          </ButtonLink>
        </div>
      </Card>
    );
  }

  if (!chaptersResult.ok) {
    return renderInAppShell(
      <Card className="p-6">
        <p className="text-sm text-rose-100">Could not load chapter list: {chaptersResult.error}</p>
      </Card>
    );
  }

  if (!answersResult.ok) {
    return renderInAppShell(
      <Card className="p-6">
        <p className="text-sm text-rose-100">Could not load answers: {answersResult.error}</p>
      </Card>
    );
  }

  const chapter = chaptersResult.data.find((item) => item.id === chapterInstanceId);
  if (!chapter) {
    return renderInAppShell(
      <Card className="p-6">
        <p className="text-sm text-rose-100">Chapter not found for this storybook.</p>
        <div className="mt-4">
          <ButtonLink href={`/book/${storybookId}/chapters`} variant="secondary">
            Back to Chapters
          </ButtonLink>
        </div>
      </Card>
    );
  }

  let questions: GuidedTemplateQuestion[] = [];
  if (storybookResult.data.templateId) {
    const templateResult = await getGuidedTemplateById(storybookResult.data.templateId);
    if (!templateResult.ok) {
      return renderInAppShell(
        <Card className="p-6">
          <p className="text-sm text-rose-100">Could not load template flow: {templateResult.error}</p>
        </Card>
      );
    }
    const template = templateResult.data;
    questions = template?.questionFlow?.[chapter.chapterKey] ?? [];
  } else {
    questions = getFreeformQuestions(chapter.title);
  }

  if (questions.length === 0) {
    return renderInAppShell(
      <Card className="p-6">
        <p className="text-sm text-white/75">
          No question flow is configured for this chapter yet.
        </p>
        <div className="mt-4">
          <ButtonLink href={`/book/${storybookId}/chapters`} variant="secondary">
            Back to Chapters
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const answersByQuestionId = new Map(answersResult.data.map((answer) => [answer.questionId, answer] as const));
  const resumeIndex = getResumeIndex({
    questions: questions.map((question) => ({ questionId: question.questionId, required: question.required })),
    answers: answersResult.data
  });

  const requestedQuestionId = getSearchString(resolvedSearchParams, "questionId");
  const requestedStep = parseStepIndex(getSearchString(resolvedSearchParams, "step"));
  const questionStepIndex =
    requestedQuestionId != null ? questions.findIndex((question) => question.questionId === requestedQuestionId) : -1;
  let selectedStepIndex = resumeIndex;
  if (requestedStep != null) selectedStepIndex = requestedStep;
  if (questionStepIndex >= 0) selectedStepIndex = questionStepIndex;
  const currentStepIndex = clampIndex(selectedStepIndex, questions.length - 1);
  const currentQuestion = questions[currentStepIndex];
  const currentAnswer = answersByQuestionId.get(currentQuestion.questionId) ?? null;
  const currentAnswerForStep = currentAnswer
    ? {
        answerText: currentAnswer.answerText,
        answerRich: currentAnswer.answerRich ?? null,
        skipped: currentAnswer.skipped,
        source: currentAnswer.source,
        sttMeta: currentAnswer.sttMeta,
        audioRef: currentAnswer.audioRef
      }
    : null;
  const answeredCount = questions.reduce((count, question) => {
    return count + (hasMeaningfulAnswer(answersByQuestionId.get(question.questionId) ?? null) ? 1 : 0);
  }, 0);

  async function handleWizardAction(formData: FormData) { // NOSONAR
    "use server";

    const currentUser = await requireAuthenticatedUser(
      `/book/${storybookId}/chapters/${chapterInstanceId}/wizard`
    );
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (currentProfile.onboarding_completed === false) {
      redirect("/app/onboarding");
    }

    const intentRaw = formData.get("intent");
    const intent = typeof intentRaw === "string" ? intentRaw : "save";
    const stepRaw = formData.get("stepIndex");
    const submittedStep = clampIndex(
      typeof stepRaw === "string" ? Number.parseInt(stepRaw, 10) || 0 : 0,
      questions.length - 1
    );
    const submittedQuestion = questions[submittedStep];
    if (submittedQuestion == null) {
      redirect(buildWizardUrl(storybookId, chapterInstanceId, { error: "save_failed" }));
    }

    if (intent === "back") {
      redirect(
        buildWizardUrl(storybookId, chapterInstanceId, {
          step: Math.max(0, submittedStep - 1)
        })
      );
    }

    const answerTextValue = formData.get("answerText");
    const answerText = typeof answerTextValue === "string" ? answerTextValue : "";
    const answerSourceRaw = formData.get("answerSource");
    const answerSource =
      answerSourceRaw === "voice" || answerSourceRaw === "text" || answerSourceRaw === "ai_narrated"
        ? answerSourceRaw
        : "text";
    const answerSttMeta = parseSttMetaJson(formData.get("answerSttMetaJson"));
    const answerAudioRefRaw = formData.get("answerAudioRef");
    const answerAudioRef = typeof answerAudioRefRaw === "string" && answerAudioRefRaw.trim() ? answerAudioRefRaw : null;

    // Sprint 31: rich text fields from hidden inputs
    const answerRichJsonRaw = formData.get("answerRichJson");
    const answerRich = (() => {
      if (typeof answerRichJsonRaw !== "string" || !answerRichJsonRaw.trim()) return null;
      try { return JSON.parse(answerRichJsonRaw) as unknown; } catch { return null; }
    })();
    const answerPlain = answerText.trim() || null;

    if ((intent === "next" || intent === "finish") && !hasAnswerText(answerText)) {
      redirect(
        buildWizardUrl(storybookId, chapterInstanceId, {
          step: submittedStep,
          error: "answer_or_skip"
        })
      );
    }

    const saveResult = await upsertGuidedChapterAnswerForUser(currentUser.id, {
      storybookId,
      chapterInstanceId,
      questionId: submittedQuestion.questionId,
      answerText: intent === "skip" ? null : answerText,
      answerRich: intent === "skip" ? null : answerRich,
      answerPlain: intent === "skip" ? null : answerPlain,
      skipped: intent === "skip",
      source: intent === "skip" ? "text" : answerSource,
      sttMeta: intent === "skip" ? null : answerSttMeta,
      audioRef: intent === "skip" ? null : answerAudioRef
    });

    if (!saveResult.ok) {
      redirect(
        buildWizardUrl(storybookId, chapterInstanceId, {
          step: submittedStep,
          error: "save_failed"
        })
      );
    }

    if (intent === "save") {
      redirect(
        buildWizardUrl(storybookId, chapterInstanceId, {
          step: submittedStep,
          notice: "saved"
        })
      );
    }

    if (intent === "skip") {
      const nextStep = Math.min(submittedStep + 1, questions.length - 1);
      redirect(
        buildWizardUrl(storybookId, chapterInstanceId, {
          step: nextStep,
          notice: "skipped"
        })
      );
    }

    if (intent === "finish") {
      const completeResult = await completeGuidedChapterForUser(currentUser.id, chapterInstanceId);
      if (!completeResult.ok) {
        redirect(
          buildWizardUrl(storybookId, chapterInstanceId, {
            step: submittedStep,
            error: "complete_failed"
          })
        );
      }

      const completion = completeResult.data;
      if (!completion.ok) {
        const firstMissingIndex = questions.findIndex((question) =>
          completion.missingQuestionIds.includes(question.questionId)
        );
        redirect(
          buildWizardUrl(storybookId, chapterInstanceId, {
            step: firstMissingIndex >= 0 ? firstMissingIndex : submittedStep,
            error: "missing_required"
          })
        );
      }

      // Check if all chapters are now complete → route to extra question
      const currentChapters = await listGuidedChaptersByStorybookForUser(currentUser.id, storybookId);
      const allChapters = currentChapters.ok ? currentChapters.data : [];
      const nextIncomplete = [...allChapters]
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .find((ch) => ch.id !== chapterInstanceId && ch.status !== "completed");
      if (nextIncomplete) {
        redirect(`/book/${storybookId}/chapters/${nextIncomplete.id}/wizard`);
      }
      // All chapters done — go to extra question
      redirect(`/book/${storybookId}/extra`);
    }

    const nextStep = Math.min(submittedStep + 1, questions.length - 1);
    redirect(
      buildWizardUrl(storybookId, chapterInstanceId, {
        step: nextStep,
        notice: "saved"
      })
    );
  }

  return renderInAppShell(
    <>
      <ViewportEvent eventName="chapter_start" eventProps={{ chapterKey: chapter.chapterKey }} />
      <WizardShell
        storyTitle={storybookResult.data.title}
        chapterTitle={chapter.title}
        stepIndex={currentStepIndex}
        totalSteps={questions.length}
        answeredCount={answeredCount}
        notice={mapNotice(getSearchString(resolvedSearchParams, "notice"))}
        error={mapError(getSearchString(resolvedSearchParams, "error"))}
        canGoBack={currentStepIndex > 0}
        isLastStep={currentStepIndex >= questions.length - 1}
        currentQuestionId={currentQuestion.questionId}
        chaptersHref={`/book/${storybookId}/chapters`}
      >
        <form id="chapter-wizard-form" action={handleWizardAction}>
          <input type="hidden" name="stepIndex" value={String(currentStepIndex)} />
          <input type="hidden" name="questionId" value={currentQuestion.questionId} />
          <QuestionStep
            question={currentQuestion}
            stepIndex={currentStepIndex}
            totalSteps={questions.length}
            currentAnswer={currentAnswerForStep}
            chapterKey={chapter.chapterKey}
            chapterTitle={chapter.title}
            storybookId={storybookId}
            chapterInstanceId={chapterInstanceId}
          />
        </form>
      </WizardShell>
    </>
  );
}
