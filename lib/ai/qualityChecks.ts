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

  return { warnings, errors };
}
