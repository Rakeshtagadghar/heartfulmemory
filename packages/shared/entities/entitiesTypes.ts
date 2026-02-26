export type EntitySource = "llm" | "override";

export type EntityPersonKind = "person" | "role";

export type EntityPersonV2 = {
  value: string;
  kind: EntityPersonKind;
  confidence: number;
  citations: string[];
  source: EntitySource;
};

export type EntityPlaceV2 = {
  value: string;
  confidence: number;
  citations: string[];
  source: EntitySource;
};

export type EntityDateV2 = {
  value: string;
  normalized: string;
  confidence: number;
  citations: string[];
  source: EntitySource;
};

export type EntitiesMetaV2 = {
  version: 2;
  generatedAt: number;
  generator: "llm_extractor_v2";
};

export type ChapterDraftEntitiesV2 = {
  people: EntityPersonV2[];
  places: EntityPlaceV2[];
  dates: EntityDateV2[];
  meta: EntitiesMetaV2;
};

export type ExtractorAnswerInput = {
  questionId: string;
  questionPrompt: string;
  answerText: string;
};

export type ExtractorWarning = {
  code: string;
  message: string;
  entityType?: "people" | "places" | "dates";
  value?: string;
};

export type EntitiesPostprocessResult = {
  entities: ChapterDraftEntitiesV2;
  warnings: ExtractorWarning[];
};

export type ChapterEntityOverrides = {
  id: string;
  storybookId: string;
  chapterInstanceId: string;
  adds: {
    people: EntityPersonV2[];
    places: EntityPlaceV2[];
    dates: EntityDateV2[];
  };
  removes: Array<{ kind: "people" | "places" | "dates"; value: string }>;
  createdAt: number;
  updatedAt: number;
};
