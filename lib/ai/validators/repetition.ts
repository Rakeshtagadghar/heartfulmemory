export type RepeatedSentenceHit = {
  sentence: string;
  sectionIds: string[];
};

function normalizeSentence(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^\w\s]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function findRepeatedSentencesAcrossSections(input: Array<{ sectionId: string; text: string }>): RepeatedSentenceHit[] {
  const seen = new Map<string, Set<string>>();
  for (const section of input) {
    for (const sentence of splitSentences(section.text)) {
      const normalized = normalizeSentence(sentence);
      if (normalized.length < 24) continue;
      const bucket = seen.get(normalized) ?? new Set<string>();
      bucket.add(section.sectionId);
      seen.set(normalized, bucket);
    }
  }

  const hits: RepeatedSentenceHit[] = [];
  for (const [sentence, sectionIds] of seen.entries()) {
    if (sectionIds.size < 2) continue;
    hits.push({ sentence, sectionIds: [...sectionIds] });
  }
  return hits;
}
