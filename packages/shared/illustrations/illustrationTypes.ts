export type IllustrationStatus = "selecting" | "ready" | "error";

export type IllustrationTheme = {
  queries: string[];
  keywords: string[];
  negativeKeywords: string[];
};

export type SlotTarget = {
  slotId: string;
  aspectTarget: number;
  orientation: "landscape" | "portrait" | "square";
  minShortSidePx: number;
};

export type SlotAssignment = {
  slotId: string;
  mediaAssetId: string;
  providerMetaSnapshot: Record<string, unknown>;
};

export type ChapterIllustrationRecord = {
  id: string;
  storybookId: string;
  chapterInstanceId: string;
  chapterKey: string;
  version: number;
  status: IllustrationStatus;
  theme: IllustrationTheme;
  slotTargets: SlotTarget[];
  slotAssignments: SlotAssignment[];
  lockedSlotIds: string[];
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: number;
  updatedAt: number;
};
