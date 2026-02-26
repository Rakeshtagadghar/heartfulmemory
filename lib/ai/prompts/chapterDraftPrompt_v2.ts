import type { ChapterDraftSectionDefinition, DraftNarrationSettings } from "../../packages/shared/drafts/draftTypes";

export type ChapterDraftPromptV2Input = {
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

const OUTPUT_SCHEMA_HINT_PATH = "docs/chapter_draft_output_schema_v2.json";

export function buildChapterDraftPromptV2(input: ChapterDraftPromptV2Input) {
  const lines: string[] = [
    "You are generating a grounded memoir chapter draft as structured JSON.",
    "Return ONLY valid JSON matching the output schema. Do not include markdown or commentary.",
    "Never include writing instructions, prompt text, section guidance, or citations inline inside section text.",
    "Section text must be user-visible storytelling only.",
    "Do not repeat the same sentence across sections.",
    "If no dates are available, timeline text must describe sequence without inventing dates.",
    "",
    `Chapter: ${input.chapterTitle} (${input.chapterKey})`,
    `Template: ${input.templateId ?? "freeform"}`,
    `Narration voice: ${input.narration.voice}`,
    `Narration tense: ${input.narration.tense}`,
    `Narration tone: ${input.narration.tone}`,
    `Narration length: ${input.narration.length}`,
    "",
    `Output schema file: ${OUTPUT_SCHEMA_HINT_PATH}`,
    "",
    "Target sections (guidance is INTERNAL and must not be copied into output text):"
  ];

  for (const section of input.targetSections) {
    lines.push(`- ${section.sectionId} | ${section.title} | guidance=${section.guidance}`);
  }

  lines.push("", "Grounding answers (use only these facts):");
  for (const qa of input.questionAnswers) {
    lines.push(`[${qa.questionId}] ${qa.prompt}`);
    lines.push(qa.answerText);
    lines.push("");
  }

  lines.push(
    "JSON requirements:",
    "- `sections[].sectionId` must match the requested section ids.",
    "- `sections[].text` must be clean narrative prose only.",
    "- `citations` arrays contain questionId strings only.",
    "- `entities` must use extracted values with confidence 0..1.",
    "- `imageIdeas.slotHint` must be one of portrait|landscape|texture|scene|object."
  );

  return lines.join("\n");
}

