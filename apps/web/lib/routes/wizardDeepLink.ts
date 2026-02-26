export function buildWizardQuestionDeepLink(input: {
  storybookId: string;
  chapterInstanceId: string;
  questionId: string;
}) {
  const params = new URLSearchParams({ questionId: input.questionId });
  return `/book/${input.storybookId}/chapters/${input.chapterInstanceId}/wizard?${params.toString()}`;
}
