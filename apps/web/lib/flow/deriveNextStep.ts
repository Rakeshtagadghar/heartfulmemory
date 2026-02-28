import type { DeriveNextStepInput, NextStepRoute } from "../../../../packages/shared/flow/flowTypes";

/**
 * Pure function: derives the next step in the guided flow for a storybook.
 * Used to power "Continue your story" CTA routing.
 */
export function deriveNextStep(input: DeriveNextStepInput): NextStepRoute {
  const { storybookId, chapters, extraAnswerStatus, photoStatus, flowStatus } = input;

  // If explicitly populating or in studio, respect that
  if (flowStatus === "populating") {
    return { state: "populating", href: null };
  }
  if (flowStatus === "ready_in_studio") {
    return { state: "ready_in_studio", href: `/studio/${storybookId}` };
  }
  if (flowStatus === "error") {
    return { state: "error", href: null };
  }

  // Find first incomplete chapter
  const firstIncomplete = chapters.find((ch) => ch.status !== "completed");
  if (firstIncomplete) {
    return {
      state: "needs_questions",
      href: `/book/${storybookId}/chapters/${firstIncomplete.id}/wizard`,
      chapterInstanceId: firstIncomplete.id
    };
  }

  // All chapters done — check extra question
  if (extraAnswerStatus === "pending") {
    return { state: "needs_extra_question", href: `/book/${storybookId}/extra` };
  }

  // Extra done/skipped — check photos
  if (photoStatus === "not_started") {
    return { state: "needs_upload_photos", href: `/book/${storybookId}/photos` };
  }

  // Photos done/skipped — studio
  return { state: "ready_in_studio", href: `/studio/${storybookId}` };
}
