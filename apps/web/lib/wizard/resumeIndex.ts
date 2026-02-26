type WizardQuestion = {
  questionId: string;
  required: boolean;
};

type WizardAnswer = {
  questionId: string;
  answerText?: string | null;
  answerJson?: unknown | null;
  skipped?: boolean;
};

function isAnswered(answer: WizardAnswer | undefined) {
  if (!answer) return false;
  if (answer.skipped) return true;
  if (typeof answer.answerText === "string" && answer.answerText.trim().length > 0) return true;
  if (answer.answerJson !== undefined && answer.answerJson !== null) return true;
  return false;
}

export function getResumeIndex(input: {
  questions: WizardQuestion[];
  answers: WizardAnswer[];
}) {
  if (input.questions.length === 0) return 0;

  const answersByQuestionId = new Map(input.answers.map((answer) => [answer.questionId, answer] as const));

  const firstUnansweredRequired = input.questions.findIndex(
    (question) => question.required && !isAnswered(answersByQuestionId.get(question.questionId))
  );
  if (firstUnansweredRequired >= 0) return firstUnansweredRequired;

  const firstUnanswered = input.questions.findIndex(
    (question) => !isAnswered(answersByQuestionId.get(question.questionId))
  );
  if (firstUnanswered >= 0) return firstUnanswered;

  return Math.max(0, input.questions.length - 1);
}

