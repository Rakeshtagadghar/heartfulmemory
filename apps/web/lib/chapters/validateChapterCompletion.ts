export function validateChapterCompletion(input: {
  requiredQuestionIds: string[];
  answeredQuestionIds: string[];
}) {
  const answered = new Set(input.answeredQuestionIds);
  const missingQuestionIds = input.requiredQuestionIds.filter((questionId) => !answered.has(questionId));

  return {
    ok: missingQuestionIds.length === 0,
    missingQuestionIds
  };
}

