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

function sectionCitations(sectionId: string, answers: GenerateChapterDraftInput["questionAnswers"]) {
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
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(3, answers.length))
    .map((row) => row.questionId);
}

function styleHint(narration: DraftNarrationSettings) {
  const voice =
    narration.voice === "first_person"
      ? "Write as the storyteller speaking about their own life."
      : "Write in third person while preserving a personal memoir tone.";
  const tense = narration.tense === "present" ? "Use present tense." : "Use past tense.";
  let tone = "Keep the tone warm and intimate.";
  if (narration.tone === "formal") tone = "Keep the tone composed and respectful.";
  else if (narration.tone === "playful") tone = "Keep the tone light and affectionate where appropriate.";
  else if (narration.tone === "poetic") tone = "Use vivid and reflective language.";
  return `${voice} ${tense} ${tone}`;
}

function narrativeAnchor(narration: DraftNarrationSettings) {
  if (narration.voice === "first_person") {
    if (narration.tense === "present") {
      return "I remember this moment as it unfolds again in memory.";
    }
    return "I remember this moment clearly.";
  }
  if (narration.tense === "present") {
    return "They return to this moment as the memory unfolds.";
  }
  return "They remembered this moment clearly.";
}

function composeSectionText(
  section: ChapterDraftSectionDefinition,
  input: GenerateChapterDraftInput,
  citations: string[]
) {
  const citedAnswers = input.questionAnswers.filter((qa) => citations.includes(qa.questionId));
  const snippets = citedAnswers.flatMap((qa) => splitSentences(qa.answerText).slice(0, 2)).filter(Boolean);
  const maxWords = input.maxWordsByLength?.[input.narrationSettings.length] ?? 700;
  const perSectionBudget = Math.max(70, Math.floor(maxWords / Math.max(1, input.targetSections.length)));

  const detailText =
    snippets.length > 0
      ? snippets.join(" ")
      : input.questionAnswers.map((qa) => qa.answerText.trim()).filter(Boolean).join(" ");

  return clampWords(
    `${section.title}. ${narrativeAnchor(input.narrationSettings)} ${styleHint(input.narrationSettings)} ${section.guidance} ${detailText}`,
    perSectionBudget
  );
}

function generateHeuristicDraft(input: GenerateChapterDraftInput): GenerateChapterDraftOutput {
  const citationsMap: Record<string, string[]> = {};
  const sections: ChapterDraftSection[] = input.targetSections.map((section) => {
    const citations = sectionCitations(section.sectionId, input.questionAnswers);
    citationsMap[section.sectionId] = citations;
    const text = composeSectionText(section, input, citations);
    return {
      sectionId: section.sectionId,
      title: section.title,
      text,
      wordCount: countWords(text),
      citations
    };
  });

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
