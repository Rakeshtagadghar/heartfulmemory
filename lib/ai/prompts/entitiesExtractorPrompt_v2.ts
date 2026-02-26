import type { ExtractorAnswerInput } from "../../../packages/shared/entities/entitiesTypes";

export function buildEntitiesExtractorPromptV2(input: {
  chapterKey: string;
  chapterTitle: string;
  answers: ExtractorAnswerInput[];
}) {
  const lines = [
    "Extract grounded entities from the provided chapter answers.",
    "Return JSON only.",
    "Schema:",
    "{",
    '  "people": [{"value":"string","kind":"person|role","confidence":0.0,"citations":["questionId"],"source":"llm"}],',
    '  "places": [{"value":"string","confidence":0.0,"citations":["questionId"],"source":"llm"}],',
    '  "dates": [{"value":"string","normalized":"string","confidence":0.0,"citations":["questionId"],"source":"llm"}],',
    `  "meta": {"version":2,"generatedAt":${Date.now()},"generator":"llm_extractor_v2"}`,
    "}",
    "Rules:",
    "- Use only the provided answers. No external knowledge.",
    "- People: only explicit names or relationship roles found in answers.",
    "- Places: only explicit locations in answers (state/country/city/region/school if clearly a place).",
    "- Dates: only explicit dates/years in answers. Do not invent.",
    "- Every entity must include citations with questionIds where it appears.",
    "- Confidence must be 0..1 and reflect explicitness.",
    "",
    `Chapter: ${input.chapterTitle} (${input.chapterKey})`,
    "Answers:"
  ];

  for (const answer of input.answers) {
    lines.push(`- [${answer.questionId}] ${answer.questionPrompt}`, `  ${answer.answerText}`);
  }

  return lines.join("\n");
}
