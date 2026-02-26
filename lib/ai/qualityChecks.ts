import type {
  ChapterDraftEntities,
  ChapterDraftSection,
  ChapterDraftWarning,
  DraftNarrationLength
} from "../../packages/shared/drafts/draftTypes";

export type DraftQualityInput = {
  sections: ChapterDraftSection[];
  summary: string;
  entities: ChapterDraftEntities;
  answers: Array<{ questionId: string; answerText: string }>;
  targetLength: DraftNarrationLength;
};

function wordCount(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function minWordsForLength(length: DraftNarrationLength) {
  if (length === "short") return 80;
  if (length === "long") return 280;
  return 160;
}

function extractNameLikeTokens(value: string) {
  const matches = value.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) ?? [];
  return matches.map((item) => item.trim()).filter((item) => item.length >= 3);
}

export function runDraftQualityChecks(input: DraftQualityInput): {
  warnings: ChapterDraftWarning[];
  errors: Array<{ code: string; message: string }>;
} {
  const warnings: ChapterDraftWarning[] = [];
  const errors: Array<{ code: string; message: string }> = [];

  const combinedText = input.sections.map((section) => section.text).join(" ").trim();
  if (!combinedText) {
    errors.push({ code: "EMPTY_OUTPUT", message: "Generated draft is empty." });
    return { warnings, errors };
  }

  const totalWords = wordCount(combinedText);
  if (totalWords < minWordsForLength(input.targetLength)) {
    warnings.push({
      code: "TOO_SHORT",
      message: `Draft appears short (${totalWords} words). Try regenerate for a fuller draft.`,
      severity: "warning"
    });
  }

  if (!input.summary.trim()) {
    warnings.push({
      code: "EMPTY_SUMMARY",
      message: "Summary is empty.",
      severity: "warning"
    });
  }

  const answerCorpus = input.answers.map((answer) => answer.answerText).join(" ");
  const knownNames = new Set(extractNameLikeTokens(answerCorpus));
  const generatedNames = new Set<string>();
  for (const person of input.entities.people) generatedNames.add(person);
  for (const section of input.sections) {
    for (const token of extractNameLikeTokens(section.text)) generatedNames.add(token);
  }

  const unexpectedNames = Array.from(generatedNames).filter((name) => !knownNames.has(name));
  if (unexpectedNames.length > 0) {
    warnings.push({
      code: "ENTITY_SANITY",
      message: `Review names not found in answers: ${unexpectedNames.slice(0, 5).join(", ")}.`,
      severity: "warning"
    });
  }

  const profanityHits = ["damn", "hell", "shit"].filter((term) =>
    combinedText.toLowerCase().includes(term)
  );
  if (profanityHits.length > 0) {
    warnings.push({
      code: "PROFANITY_REVIEW",
      message: "Draft includes language that may need review.",
      severity: "info"
    });
  }

  return { warnings, errors };
}
