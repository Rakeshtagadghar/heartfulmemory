export type DraftNarrationVoice = "first_person" | "third_person";
export type DraftNarrationTense = "past" | "present";
export type DraftNarrationTone = "warm" | "formal" | "playful" | "poetic";
export type DraftNarrationLength = "short" | "medium" | "long";

export type DraftNarrationSettings = {
  voice: DraftNarrationVoice;
  tense: DraftNarrationTense;
  tone: DraftNarrationTone;
  length: DraftNarrationLength;
};

export type ChapterDraftStatus = "generating" | "ready" | "error";

export type ChapterDraftSection = {
  sectionId: string;
  title: string;
  text: string;
  wordCount: number;
  citations: string[];
  uncertain?: boolean;
};

export type ChapterDraftKeyFact = {
  text: string;
  citations: string[];
  uncertain?: boolean;
};

export type ChapterDraftQuote = {
  text: string;
  speaker?: string;
  citations: string[];
  uncertain?: boolean;
};

export type ChapterDraftEntities = {
  people: string[];
  places: string[];
  dates: string[];
};

export type ChapterDraftImageIdea = {
  query: string;
  reason: string;
  slotHint?: string;
};

export type ChapterDraftWarning = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  sectionId?: string;
};

export type ChapterDraftGenerationScope =
  | { kind: "full" }
  | { kind: "section"; targetSectionId: string };

export type ChapterDraftRecord = {
  storybookId: string;
  chapterInstanceId: string;
  chapterKey: string;
  version: number;
  status: ChapterDraftStatus;
  narration: DraftNarrationSettings;
  sections: ChapterDraftSection[];
  summary: string;
  keyFacts: ChapterDraftKeyFact[];
  quotes: ChapterDraftQuote[];
  entities: ChapterDraftEntities;
  imageIdeas: ChapterDraftImageIdea[];
  sourceAnswerIds: string[];
  warnings?: ChapterDraftWarning[];
  errorCode?: string | null;
  errorMessage?: string | null;
  generationScope?: ChapterDraftGenerationScope;
  approvedAt?: number | null;
  createdAt: number;
  updatedAt: number;
};

export type ChapterDraftSectionDefinition = {
  sectionId: string;
  title: string;
  guidance: string;
};

