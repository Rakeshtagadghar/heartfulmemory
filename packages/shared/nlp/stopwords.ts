export const COMMON_ENTITY_STOPWORDS = [
  "the",
  "my",
  "our",
  "i",
  "we",
  "a",
  "an",
  "and"
] as const;

export const COMMON_ENTITY_STOPWORD_SET = new Set<string>(COMMON_ENTITY_STOPWORDS);

export function isCommonEntityStopword(value: string) {
  return COMMON_ENTITY_STOPWORD_SET.has(value.trim().toLowerCase());
}

