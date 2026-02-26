export type PopulationVersionRefs = {
  draftVersion: number | null;
  illustrationVersion: number | null;
};

export type PopulationSlotRef = {
  pageTemplateId: string;
  slotId: string;
};

export type PopulationStableNodeRef = PopulationSlotRef & {
  nodeId: string;
  nodeType: "TEXT" | "IMAGE" | "FRAME";
};

export type ChapterPopulationInputV1 = {
  templateId: string | null;
  chapterKey: string;
  chapterInstanceId: string;
  storybookId: string;
  draftVersionRef: number | null;
  illustrationVersionRef: number | null;
};

export type ChapterPopulationMetadataV1 = {
  chapterKey: string;
  chapterInstanceId: string;
  lastAppliedDraftVersion: number | null;
  lastAppliedIllustrationVersion: number | null;
  draftFingerprint: string | null;
  illustrationFingerprint: string | null;
  pageIds: string[];
  stableNodes: PopulationStableNodeRef[];
  warnings: Array<{
    code: string;
    message: string;
    slotId?: string;
    pageTemplateId?: string;
  }>;
  populatedAt: number;
};

export type ChapterPopulationResultV1 = {
  ok: true;
  storybookId: string;
  chapterInstanceId: string;
  chapterKey: string;
  pageIds: string[];
  createdNodeIds: string[];
  updatedNodeIds: string[];
  skippedNodeIds: string[];
  versions: PopulationVersionRefs;
  metadata: ChapterPopulationMetadataV1;
} | {
  ok: false;
  errorCode: string;
  message: string;
  retryable?: boolean;
};

export type StudioPopulateContractV1 = {
  version: "v1";
  stableNodeIdStrategy: "chapterKey:pageTemplateId:slotId";
  overwritePolicy: "skip_user_edited_nodes";
  rendererCompatibility: "layout_pdf_renderer_v1";
};

export const STUDIO_POPULATE_CONTRACT_V1: StudioPopulateContractV1 = {
  version: "v1",
  stableNodeIdStrategy: "chapterKey:pageTemplateId:slotId",
  overwritePolicy: "skip_user_edited_nodes",
  rendererCompatibility: "layout_pdf_renderer_v1"
};
