import type {
  ChapterDraftEntities,
  ChapterDraftImageIdea,
  ChapterDraftKeyFact,
  ChapterDraftQuote,
  ChapterDraftSection,
  ChapterDraftSectionDefinition,
  DraftNarrationLength,
  DraftNarrationSettings
} from "../../packages/shared/drafts/draftTypes";
import type { AiProviderName } from "../config/ai";

export type GenerateChapterDraftInput = {
  templateId: string | null;
  chapterKey: string;
  chapterTitle: string;
  questionAnswers: Array<{
    questionId: string;
    prompt: string;
    answerText: string;
  }>;
  narrationSettings: DraftNarrationSettings;
  targetSections: ChapterDraftSectionDefinition[];
  promptText?: string;
  timeoutMs?: number;
  maxWordsByLength?: Record<DraftNarrationLength, number>;
};

export type GenerateChapterDraftOutput = {
  provider: AiProviderName;
  summary: string;
  sections: ChapterDraftSection[];
  keyFacts: ChapterDraftKeyFact[];
  quotes: ChapterDraftQuote[];
  entities: ChapterDraftEntities;
  imageIdeas: ChapterDraftImageIdea[];
  citationsMap: Record<string, string[]>;
};

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSentenceForOverlap(value: string) {
  return value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function clampWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractEntitiesFromAnswers(
  answers: GenerateChapterDraftInput["questionAnswers"]
): ChapterDraftEntities {
  const people = new Set<string>();
  const places = new Set<string>();
  const dates = new Set<string>();

  for (const qa of answers) {
    for (const match of qa.answerText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) ?? []) {
      if (/(Street|Road|School|College|Park|Town|Village|City|Temple|Church)/.test(match)) places.add(match);
      else people.add(match);
    }
    for (const year of qa.answerText.match(/\b(?:18|19|20)\d{2}\b/g) ?? []) dates.add(year);
  }

  return {
    people: Array.from(people).slice(0, 8),
    places: Array.from(places).slice(0, 8),
    dates: Array.from(dates).slice(0, 8)
  };
}

function sectionCitationRanking(sectionId: string, answers: GenerateChapterDraftInput["questionAnswers"]) {
  const lower = sectionId.toLowerCase();
  return answers
    .map((qa) => {
      const prompt = qa.prompt.toLowerCase();
      let score = Math.min(2, Math.floor(qa.answerText.length / 140));
      if (lower.includes("intro") && (prompt.includes("where") || prompt.includes("born"))) score += 3;
      if (lower.includes("main") && (prompt.includes("what") || prompt.includes("remember") || prompt.includes("story"))) score += 3;
      if (lower.includes("reflection") && (prompt.includes("feel") || prompt.includes("lesson") || prompt.includes("meaning"))) score += 3;
      if (lower.includes("closing")) score += 1;
      if (lower.includes("timeline") && (prompt.includes("day") || prompt.includes("year") || prompt.includes("when"))) score += 3;
      return { questionId: qa.questionId, score };
    })
    .sort((a, b) => b.score - a.score);
}

function sectionCitations(
  sectionId: string,
  answers: GenerateChapterDraftInput["questionAnswers"],
  usedPrimaryQuestions: Set<string>
) {
  const ranked = sectionCitationRanking(sectionId, answers);
  const primary =
    ranked.find((row) => !usedPrimaryQuestions.has(row.questionId))?.questionId ?? ranked[0]?.questionId ?? null;
  if (primary) usedPrimaryQuestions.add(primary);

  const citations: string[] = [];
  if (primary) citations.push(primary);
  for (const row of ranked) {
    if (citations.includes(row.questionId)) continue;
    citations.push(row.questionId);
    if (citations.length >= Math.min(3, answers.length)) break;
  }
  return citations;
}

function sectionLeadPhrase(sectionId: string, narration: DraftNarrationSettings) {
  const key = sectionId.toLowerCase();
  if (key.includes("timeline")) {
    return narration.voice === "first_person"
      ? "I can trace the memory step by step, with one moment leading into the next."
      : "They move through the memory step by step, with one moment leading into the next.";
  }
  if (key.includes("reflection")) {
    return narration.voice === "first_person"
      ? "When I look back, the meaning of this chapter comes into focus."
      : "When they look back, the meaning of this chapter comes into focus.";
  }
  if (key.includes("intro")) {
    return narration.voice === "first_person"
      ? "This story begins in a specific place, with the people and atmosphere that shaped the start."
      : "This story begins in a specific place, with the people and atmosphere that shaped the start.";
  }
  if (key.includes("main")) {
    return narration.voice === "first_person"
      ? "The central events become clear through concrete details and interactions."
      : "The central events become clear through concrete details and interactions.";
  }
  if (key.includes("closing")) {
    return narration.voice === "first_person"
      ? "By the end, I can see what I carry forward from these memories."
      : "By the end, they can see what they carry forward from these memories.";
  }
  return narration.voice === "first_person"
    ? "This section adds a distinct layer to my account of the chapter."
    : "This section adds a distinct layer to their account of the chapter.";
}

function sectionKeywords(sectionId: string) {
  const key = sectionId.toLowerCase();
  if (key.includes("intro")) return ["where", "born", "home", "family", "origin", "start", "beginning", "place"];
  if (key.includes("timeline")) return ["when", "year", "day", "sequence", "later", "after", "before", "timeline"];
  if (key.includes("reflection")) return ["feel", "learn", "meaning", "lesson", "wish", "realize", "reflection"];
  if (key.includes("main")) return ["story", "event", "moment", "happened", "remember", "conflict"];
  if (key.includes("closing")) return ["now", "today", "carry", "forward", "end", "close"];
  return ["story", "moment"];
}

function normalizeSentenceForKey(value: string) {
  return normalizeSentenceForOverlap(value);
}

type SentenceCandidate = {
  key: string;
  questionId: string;
  prompt: string;
  text: string;
  order: number;
};

function buildSentencePool(answers: GenerateChapterDraftInput["questionAnswers"]): SentenceCandidate[] {
  const pool: SentenceCandidate[] = [];
  for (const qa of answers) {
    const sentences = splitSentences(qa.answerText);
    for (let index = 0; index < sentences.length; index += 1) {
      const text = sentences[index]!;
      const key = normalizeSentenceForKey(text);
      if (key.length < 28) continue;
      pool.push({
        key,
        questionId: qa.questionId,
        prompt: qa.prompt.toLowerCase(),
        text,
        order: index
      });
    }
  }
  return pool;
}

function scoreSentenceForSection(candidate: SentenceCandidate, sectionId: string) {
  const keywords = sectionKeywords(sectionId);
  const haystack = `${candidate.prompt} ${candidate.key}`;
  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 3;
  }
  if (candidate.order === 0) score += 1;
  return score;
}

function pickDistinctSectionSentences(args: {
  sectionId: string;
  citations: string[];
  sentencePool: SentenceCandidate[];
  usedKeys: Set<string>;
}) {
  const fromCitations = args.sentencePool.filter((row) => args.citations.includes(row.questionId));
  const basePool = fromCitations.length > 0 ? fromCitations : args.sentencePool;
  const ranked = [...basePool].sort((a, b) => {
    const aScore = scoreSentenceForSection(a, args.sectionId) + (args.usedKeys.has(a.key) ? -5 : 2);
    const bScore = scoreSentenceForSection(b, args.sectionId) + (args.usedKeys.has(b.key) ? -5 : 2);
    return bScore - aScore;
  });

  const picked: SentenceCandidate[] = [];
  for (const candidate of ranked) {
    if (!args.usedKeys.has(candidate.key)) {
      picked.push(candidate);
      args.usedKeys.add(candidate.key);
    }
    if (picked.length >= 4) break;
  }

  return picked.map((item) => item.text);
}

function sectionFocusFrame(sectionId: string) {
  const key = sectionId.toLowerCase();
  if (key.includes("timeline")) {
    return "The sequence stays chronological and emphasizes transitions between events.";
  }
  if (key.includes("reflection")) {
    return "The focus stays on interpretation, values, and emotional aftereffects.";
  }
  if (key.includes("intro")) {
    return "The focus stays on setting, context, and who is present at the beginning.";
  }
  if (key.includes("main")) {
    return "The focus stays on the core actions and interactions that define the chapter.";
  }
  if (key.includes("closing")) {
    return "The focus stays on resolution and what remains meaningful now.";
  }
  return "The focus stays on a distinct angle of the chapter.";
}

function fallbackSnippetFromAnswers(
  sectionId: string,
  citations: string[],
  input: GenerateChapterDraftInput,
  usedKeys: Set<string>
) {
  const ranked = sectionCitationRanking(sectionId, input.questionAnswers);
  const orderedIds = [
    ...citations,
    ...ranked.map((row) => row.questionId).filter((id) => !citations.includes(id))
  ];
  for (const questionId of orderedIds) {
    const answer = input.questionAnswers.find((qa) => qa.questionId === questionId);
    if (!answer) continue;
    const words = answer.answerText.trim().split(/\s+/).filter(Boolean).slice(0, 22).join(" ");
    if (!words) continue;
    const sentence = `${sectionFocusFrame(sectionId)} ${words}.`;
    const key = normalizeSentenceForKey(sentence);
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      return sentence;
    }
  }
  const generic = `${sectionFocusFrame(sectionId)} This passage keeps a different emphasis from the rest of the chapter.`;
  const genericKey = normalizeSentenceForKey(generic);
  if (!usedKeys.has(genericKey)) {
    usedKeys.add(genericKey);
    return generic;
  }
  return `${sectionFocusFrame(sectionId)}.`;
}

function composeSectionText(
  section: ChapterDraftSectionDefinition,
  input: GenerateChapterDraftInput,
  citations: string[],
  sentencePool: SentenceCandidate[],
  usedKeys: Set<string>
) {
  const snippets = pickDistinctSectionSentences({
    sectionId: section.sectionId,
    citations,
    sentencePool,
    usedKeys
  });
  const maxWords = input.maxWordsByLength?.[input.narrationSettings.length] ?? 700;
  const perSectionBudget = Math.max(70, Math.floor(maxWords / Math.max(1, input.targetSections.length)));

  const detailText =
    snippets.length > 0
      ? snippets.join(" ")
      : fallbackSnippetFromAnswers(section.sectionId, citations, input, usedKeys);

  const lead = sectionLeadPhrase(section.sectionId, input.narrationSettings);
  const key = section.sectionId.toLowerCase();
  const tenseHint =
    input.narrationSettings.tense === "present"
      ? "The narration stays in present time."
      : "The narration stays in remembered past time.";
  const sectionFrame = sectionFocusFrame(key);

  return clampWords(
    `${lead} ${sectionFrame} ${tenseHint} ${detailText}`.replaceAll(/\s+/g, " ").trim(),
    perSectionBudget
  );
}

function removeDuplicateSentencesAcrossSections(sections: ChapterDraftSection[]) {
  const seen = new Set<string>();
  return sections.map((section) => {
    const uniqueSentences: string[] = [];
    for (const sentence of splitSentences(section.text)) {
      const key = normalizeSentenceForOverlap(sentence);
      const isTracked = key.length > 30;
      if (isTracked && seen.has(key)) continue;
      uniqueSentences.push(sentence);
      if (isTracked) seen.add(key);
    }
    const text = uniqueSentences.join(" ").trim() || section.text.trim();
    return {
      ...section,
      text,
      wordCount: countWords(text)
    };
  });
}

function generateHeuristicDraft(input: GenerateChapterDraftInput): GenerateChapterDraftOutput {
  const citationsMap: Record<string, string[]> = {};
  const sentencePool = buildSentencePool(input.questionAnswers);
  const usedSentenceKeys = new Set<string>();
  const usedPrimaryQuestions = new Set<string>();
  const rawSections: ChapterDraftSection[] = input.targetSections.map((section) => {
    const citations = sectionCitations(section.sectionId, input.questionAnswers, usedPrimaryQuestions);
    citationsMap[section.sectionId] = citations;
    const text = composeSectionText(section, input, citations, sentencePool, usedSentenceKeys);
    return {
      sectionId: section.sectionId,
      title: section.title,
      text,
      wordCount: countWords(text),
      citations
    };
  });
  const sections = removeDuplicateSentencesAcrossSections(rawSections);

  const entities = extractEntitiesFromAnswers(input.questionAnswers);
  const keyFacts: ChapterDraftKeyFact[] = input.questionAnswers.slice(0, 4).map((qa) => ({
    text: clampWords(`${qa.prompt.replace(/\?$/, "")}: ${qa.answerText}`, 26),
    citations: [qa.questionId]
  }));
  const quotes: ChapterDraftQuote[] = input.questionAnswers
    .filter((qa) => qa.answerText.trim().length > 0)
    .slice(0, 2)
    .map((qa) => ({
      text: clampWords(splitSentences(qa.answerText)[0] ?? qa.answerText, 22),
      citations: [qa.questionId]
    }));
  const summary = clampWords(
    `${input.chapterTitle} is a grounded memoir chapter built from the storyteller's answers, highlighting key people, places, and memories.`,
    34
  );
  const imageIdeas: ChapterDraftImageIdea[] = [
    { query: `${input.chapterTitle} memory family photo`, reason: "Primary chapter theme visual." }
  ];
  if (entities.places[0]) {
    imageIdeas.push({
      query: `${entities.places[0]} old neighborhood home`,
      reason: "Place named in the answers.",
      slotHint: "setting"
    });
  }
  if (entities.people[0]) {
    imageIdeas.push({
      query: `${entities.people[0]} family portrait`,
      reason: "Person named in the answers.",
      slotHint: "portrait"
    });
  }

  return {
    provider: "heuristic",
    summary,
    sections,
    keyFacts,
    quotes,
    entities,
    imageIdeas,
    citationsMap
  };
}

export function createLlmRegistry(config: { providerDefault: AiProviderName; groqApiKey?: string | null }) {
  return {
    async generateChapterDraft(input: GenerateChapterDraftInput) {
      if (config.providerDefault === "groq" && config.groqApiKey) {
        // External provider integration can be plugged in here; Sprint 19 ships a deterministic fallback.
        return generateHeuristicDraft(input);
      }
      return generateHeuristicDraft(input);
    }
  };
}
