type AnswerHashInput = {
  questionId: string;
  answerText: string;
};

function normalizeText(value: string) {
  return value.trim().replaceAll(/\s+/g, " ");
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function computeAnswersHash(answers: AnswerHashInput[]) {
  const serialized = answers
    .map((answer) => ({
      questionId: answer.questionId,
      answerText: normalizeText(answer.answerText)
    }))
    .sort((a, b) => a.questionId.localeCompare(b.questionId))
    .map((row) => `${row.questionId}:${row.answerText}`)
    .join("|");
  return `fnv1a32:${fnv1a32(serialized)}`;
}
