import type { ChapterDraftEntities, ChapterDraftSection } from "../../packages/shared/drafts/draftTypes";
import { detectPromptLeakage, startsWithLiteralSectionLabel } from "./promptLeak";
import { findRepeatedSentencesAcrossSections } from "./repetition";

type Severity = "info" | "warning" | "error";

export type DraftValidatorMessage = {
  code: string;
  message: string;
  severity: Severity;
  sectionId?: string;
};

export type DraftValidatorInput = {
  sections: ChapterDraftSection[];
  entities: ChapterDraftEntities;
  minWordsPerSection?: number;
};

const ENTITY_STOPWORDS = new Set(["the", "my", "our", "i", "we"]);

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function invalidEntityValues(values: string[]) {
  return values.filter((value) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return true;
    return ENTITY_STOPWORDS.has(trimmed.toLowerCase());
  });
}

export function validateDraftOutputV1(input: DraftValidatorInput): {
  valid: boolean;
  errors: DraftValidatorMessage[];
  warnings: DraftValidatorMessage[];
} {
  const errors: DraftValidatorMessage[] = [];
  const warnings: DraftValidatorMessage[] = [];
  const minWordsPerSection = input.minWordsPerSection ?? 35;

  for (const section of input.sections) {
    const text = section.text ?? "";
    const promptLeakHits = detectPromptLeakage(text);
    if (promptLeakHits.length > 0) {
      errors.push({
        code: "PROMPT_LEAK",
        message: "Section contains internal writing instructions or prompt text.",
        severity: "error",
        sectionId: section.sectionId
      });
    }
    if (startsWithLiteralSectionLabel(text)) {
      warnings.push({
        code: "SECTION_LABEL_PREFIX",
        message: "Section starts with a literal label prefix; prefer direct storytelling prose.",
        severity: "warning",
        sectionId: section.sectionId
      });
    }
    if (wordCount(text) < minWordsPerSection) {
      warnings.push({
        code: "SECTION_TOO_SHORT",
        message: `Section looks short (${wordCount(text)} words).`,
        severity: "warning",
        sectionId: section.sectionId
      });
    }
  }

  const repeated = findRepeatedSentencesAcrossSections(
    input.sections.map((section) => ({ sectionId: section.sectionId, text: section.text ?? "" }))
  );
  if (repeated.length > 0) {
    errors.push({
      code: "REPEATED_SECTION_TEXT",
      message: "Repeated sentence(s) detected across sections.",
      severity: "error"
    });
  }

  const badEntities = [
    ...invalidEntityValues(input.entities.people),
    ...invalidEntityValues(input.entities.places),
    ...invalidEntityValues(input.entities.dates)
  ];
  if (badEntities.length > 0) {
    warnings.push({
      code: "ENTITY_STOPWORDS",
      message: `Entity values need review: ${badEntities.slice(0, 5).join(", ")}.`,
      severity: "warning"
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

