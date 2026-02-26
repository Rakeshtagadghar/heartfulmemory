type NarrationLike = Record<string, unknown> | null | undefined;
type ChapterDraftLike = {
  summary: string;
  keyFacts: Array<{ text: string }>;
  entities: { people: string[]; places: string[]; dates: string[] };
  imageIdeas: Array<{ query: string }>;
};

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function looksLikePrivateName(value: string) {
  const tokens = value.trim().split(/\s+/);
  if (tokens.length === 0 || tokens.length > 2) return false;
  return tokens.every((token) => /^[A-Z][a-z]+$/.test(token));
}

function scrubLikelyNameTokens(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.replaceAll(/[^A-Za-z0-9-]/g, ""))
    .filter(Boolean)
    .filter((token) => !looksLikePrivateName(token))
    .join(" ")
    .trim();
}

function safePlaceKeyword(place: string) {
  const trimmed = place.trim();
  if (!trimmed) return null;
  if (looksLikePrivateName(trimmed)) return null;
  return trimmed.toLowerCase();
}

export type GeneratedChapterTheme = {
  queries: string[];
  keywords: string[];
  negativeKeywords: string[];
};

export function generateThemeForChapterDraft(input: {
  chapterTitle: string;
  chapterKey: string;
  storybook: { templateTitle: string | null; narration: NarrationLike };
  chapterDraft: ChapterDraftLike;
}): GeneratedChapterTheme {
  const tone = String((input.storybook.narration as Record<string, unknown> | null | undefined)?.tone ?? "warm");
  const chapterKeyPhrase = input.chapterKey.replace(/^ch_/, "").replaceAll("_", " ");
  const safeTitlePhrase = scrubLikelyNameTokens(input.chapterTitle) || chapterKeyPhrase;
  const chapterTokens = tokenize(`${safeTitlePhrase} ${input.chapterKey}`);
  const summaryTokens = tokenize(input.chapterDraft.summary).slice(0, 20);
  const factTokens = tokenize(input.chapterDraft.keyFacts.map((fact) => fact.text).join(" ")).slice(0, 20);
  const placeKeywords = (input.chapterDraft.entities.places ?? [])
    .map(safePlaceKeyword)
    .filter((value): value is string => Boolean(value));
  const imageIdeaTokens = tokenize(input.chapterDraft.imageIdeas.map((idea) => idea.query).join(" ")).slice(0, 15);

  const keywords = uniqueStrings([
    ...chapterTokens,
    ...summaryTokens,
    ...factTokens,
    ...placeKeywords,
    ...imageIdeaTokens
  ]).filter((token) => token.length >= 3 && !/^\d+$/.test(token));

  let toneHint = "warm nostalgic";
  if (tone === "poetic") toneHint = "soft light nostalgic";
  else if (tone === "playful") toneHint = "joyful candid";
  else if (tone === "formal") toneHint = "documentary portrait";

  const baseSubject = uniqueStrings([
    safeTitlePhrase.toLowerCase(),
    ...placeKeywords.slice(0, 2),
    ...keywords.slice(0, 6)
  ])
    .join(" ")
    .trim();

  const queries = uniqueStrings([
    `${baseSubject} ${toneHint}`.trim(),
    `${safeTitlePhrase.toLowerCase()} family memory photo`.trim(),
    placeKeywords[0] ? `${placeKeywords[0]} old neighborhood` : "",
    `${chapterKeyPhrase} vintage photo`.trim(),
    `${toneHint} family life`.trim()
  ])
    .filter((query) => query.length > 0)
    .slice(0, 6);

  const negativeKeywords = uniqueStrings([
    "text overlay",
    "watermark",
    "logo",
    "blurry",
    "low resolution",
    "cartoon"
  ]).slice(0, 8);

  return {
    queries,
    keywords: keywords.slice(0, 24),
    negativeKeywords
  };
}
