import type {
  ChapterDraftEntities,
  ChapterDraftSection,
  ChapterDraftWarning,
  DraftNarrationLength
} from "../../packages/shared/drafts/draftTypes";
import type { ChapterDraftEntitiesV2 } from "../../packages/shared/entities/entitiesTypes";
import { ENTITY_THRESHOLD_CONFIG } from "../config/entityThresholds";
import { runEntitySanityChecksV2 } from "./qualityChecks/entitySanity_v2";

export type DraftQualityInput = {
  sections: ChapterDraftSection[];
  summary: string;
  entities: ChapterDraftEntities;
  entitiesV2?: ChapterDraftEntitiesV2 | null;
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

function sentenceSet(text: string) {
  return new Set(
    text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim())
      .filter((sentence) => sentence.length > 30)
  );
}

function sentenceOverlapRatio(a: Set<string>, b: Set<string>) {
  const smaller = a.size <= b.size ? a : b;
  const larger = a.size <= b.size ? b : a;
  if (smaller.size === 0 || larger.size === 0) return 0;
  let overlap = 0;
  for (const sentence of smaller) {
    if (larger.has(sentence)) overlap += 1;
  }
  return overlap / smaller.size;
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

  if (input.entitiesV2) {
    const entitySanity = runEntitySanityChecksV2({
      entitiesV2: input.entitiesV2,
      answers: input.answers
    });

    if (entitySanity.lowConfidence.length > 0) {
      warnings.push({
        code: "ENTITY_LOW_CONFIDENCE",
        message: `Low-confidence entities detected (threshold ${ENTITY_THRESHOLD_CONFIG.LOW_CONFIDENCE_WARN}): ${entitySanity.lowConfidence
          .slice(0, 5)
          .join(", ")}.`,
        severity: "info"
      });
    }

    if (entitySanity.notInCitedAnswers.length > 0) {
      warnings.push({
        code: "ENTITY_SANITY",
        message: `Review entities that were not found in cited answers: ${entitySanity.notInCitedAnswers
          .slice(0, 5)
          .join(", ")}.`,
        severity: "warning"
      });
    }

    if (entitySanity.missingCitations.length > 0) {
      const message = `Entities are missing citations: ${entitySanity.missingCitations.slice(0, 5).join(", ")}.`;
      if (ENTITY_THRESHOLD_CONFIG.MISSING_CITATION_ERROR) {
        errors.push({ code: "ENTITY_MISSING_CITATION", message });
      } else {
        warnings.push({ code: "ENTITY_MISSING_CITATION", message, severity: "warning" });
      }
    }
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

  for (let leftIndex = 0; leftIndex < input.sections.length; leftIndex += 1) {
    const left = input.sections[leftIndex]!;
    if (wordCount(left.text) < 40) continue;
    const leftSentences = sentenceSet(left.text);
    for (let rightIndex = leftIndex + 1; rightIndex < input.sections.length; rightIndex += 1) {
      const right = input.sections[rightIndex]!;
      if (wordCount(right.text) < 40) continue;
      const rightSentences = sentenceSet(right.text);
      const overlap = sentenceOverlapRatio(leftSentences, rightSentences);

      if (overlap >= 0.5) {
        errors.push({
          code: "REPEATED_SECTION_TEXT",
          message: `Sections "${left.title}" and "${right.title}" reuse too many of the same sentences. Regenerate with distinct section focus.`
        });
        return { warnings, errors };
      }

      if (overlap >= 0.3) {
        warnings.push({
          code: "REPEATED_SECTION_TEXT",
          message: `Sections "${left.title}" and "${right.title}" share several identical sentences.`,
          severity: "warning",
          sectionId: right.sectionId
        });
      }
    }
  }

  return { warnings, errors };
}
