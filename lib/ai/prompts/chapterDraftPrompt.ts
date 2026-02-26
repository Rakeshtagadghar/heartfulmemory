import type {
  ChapterDraftSectionDefinition,
  DraftNarrationSettings
} from "../../packages/shared/drafts/draftTypes";

export type ChapterDraftPromptInput = {
  templateId: string | null;
  chapterKey: string;
  chapterTitle: string;
  questionAnswers: Array<{
    questionId: string;
    prompt: string;
    answerText: string;
  }>;
  narration: DraftNarrationSettings;
  targetSections: ChapterDraftSectionDefinition[];
};

export function buildChapterDraftPrompt(input: ChapterDraftPromptInput) {
  const lines = [
    "Generate a grounded memoir chapter draft using only the provided answers.",
    `Chapter: ${input.chapterTitle} (${input.chapterKey})`,
    `Template: ${input.templateId ?? "freeform"}`,
    `Narration voice: ${input.narration.voice}`,
    `Narration tense: ${input.narration.tense}`,
    `Narration tone: ${input.narration.tone}`,
    `Narration length: ${input.narration.length}`,
    "",
    "Target sections:"
  ];

  for (const section of input.targetSections) {
    lines.push(`- ${section.sectionId} | ${section.title} | ${section.guidance}`);
  }

  lines.push("", "Answers (grounding source):");
  for (const qa of input.questionAnswers) {
    lines.push(`[${qa.questionId}] ${qa.prompt}`);
    lines.push(qa.answerText);
    lines.push("");
  }

  lines.push(
    "Constraints:",
    "- Do not add facts not present in answers.",
    "- If uncertain, mark the claim uncertain and omit citations.",
    "- Return structured sections with citations referencing questionIds."
  );

  return lines.join("\n");
}
