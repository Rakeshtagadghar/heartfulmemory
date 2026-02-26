import { isCommonEntityStopword } from "../../../packages/shared/nlp/stopwords";
import type { ChapterDraftEntities } from "../../../packages/shared/drafts/draftTypes";

export type EntitySanityInput = {
  entities: ChapterDraftEntities;
  answers: Array<{ questionId: string; answerText: string }>;
};

function normalizeToken(value: string) {
  return value.toLowerCase().replaceAll(/\s+/g, " ").trim();
}

function isLikelyBadEntityValue(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 2) return true;
  return isCommonEntityStopword(trimmed);
}

function answerCorpusText(answers: EntitySanityInput["answers"]) {
  return answers.map((answer) => answer.answerText).join(" ").toLowerCase();
}

function appearsInAnswerCorpus(value: string, corpus: string) {
  const normalized = normalizeToken(value);
  if (!normalized) return false;
  return corpus.includes(normalized);
}

export function runEntitySanityChecks(input: EntitySanityInput) {
  const corpus = answerCorpusText(input.answers);
  const invalidStopwords = new Set<string>();
  const unexpected: string[] = [];

  const allValues = [
    ...input.entities.people,
    ...input.entities.places,
    ...input.entities.dates
  ];

  for (const raw of allValues) {
    const value = raw.trim();
    if (!value) continue;
    if (isLikelyBadEntityValue(value)) {
      invalidStopwords.add(value);
      continue;
    }
    if (!appearsInAnswerCorpus(value, corpus)) {
      unexpected.push(value);
    }
  }

  return {
    invalidStopwords: [...invalidStopwords],
    unexpected
  };
}
