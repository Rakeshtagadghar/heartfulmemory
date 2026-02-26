import type { ChapterDraftEntitiesV2 } from "../../../packages/shared/entities/entitiesTypes";
import { ENTITY_THRESHOLD_CONFIG } from "../../config/entityThresholds";

type AnswerRow = { questionId: string; answerText: string };

export type EntitySanityV2Input = {
  entitiesV2: ChapterDraftEntitiesV2 | null | undefined;
  answers: AnswerRow[];
};

function normalize(value: string) {
  return value.toLowerCase().replaceAll(/\s+/g, " ").trim();
}

function answerMap(answers: AnswerRow[]) {
  const map = new Map<string, string>();
  for (const answer of answers) {
    map.set(answer.questionId, normalize(answer.answerText));
  }
  return map;
}

function appearsInCitedAnswers(value: string, citations: string[], answersById: Map<string, string>) {
  const normalizedValue = normalize(value);
  if (!normalizedValue) return false;
  for (const citation of citations) {
    const text = answersById.get(citation);
    if (text && text.includes(normalizedValue)) return true;
  }
  return false;
}

export function runEntitySanityChecksV2(input: EntitySanityV2Input) {
  const lowConfidence: string[] = [];
  const missingCitations: string[] = [];
  const notInCitedAnswers: string[] = [];

  if (!input.entitiesV2) {
    return { lowConfidence, missingCitations, notInCitedAnswers };
  }

  const answersById = answerMap(input.answers);
  const rows = [
    ...input.entitiesV2.people.map((item) => ({ kind: "people" as const, value: item.value, citations: item.citations, confidence: item.confidence })),
    ...input.entitiesV2.places.map((item) => ({ kind: "places" as const, value: item.value, citations: item.citations, confidence: item.confidence })),
    ...input.entitiesV2.dates.map((item) => ({ kind: "dates" as const, value: item.value, citations: item.citations, confidence: item.confidence }))
  ];

  for (const row of rows) {
    const label = `${row.kind}:${row.value}`;
    if (!Array.isArray(row.citations) || row.citations.length === 0) {
      missingCitations.push(label);
      continue;
    }
    if (row.confidence < ENTITY_THRESHOLD_CONFIG.LOW_CONFIDENCE_WARN) {
      lowConfidence.push(label);
    }
    if (!appearsInCitedAnswers(row.value, row.citations, answersById)) {
      notInCitedAnswers.push(label);
    }
  }

  return {
    lowConfidence,
    missingCitations,
    notInCitedAnswers
  };
}
