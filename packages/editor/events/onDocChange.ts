export type ChapterStudioStatus = "not_started" | "populated" | "edited" | "finalized";

export type StudioPopulateMetaV1 = {
  source: "studio_populate_v1";
  chapterKey: string;
  pageTemplateId?: string;
  slotId?: string;
  stableNodeKey?: string;
};

export type DocChangeNodeLike = {
  id: string;
  content?: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function readStudioPopulateMetaFromContent(content: unknown): StudioPopulateMetaV1 | null {
  const contentRecord = asRecord(content);
  const meta = asRecord(contentRecord?.populateMeta);
  if (!meta) return null;
  if (meta.source !== "studio_populate_v1") return null;
  if (typeof meta.chapterKey !== "string" || meta.chapterKey.trim().length === 0) return null;
  return {
    source: "studio_populate_v1",
    chapterKey: meta.chapterKey,
    pageTemplateId: typeof meta.pageTemplateId === "string" ? meta.pageTemplateId : undefined,
    slotId: typeof meta.slotId === "string" ? meta.slotId : undefined,
    stableNodeKey: typeof meta.stableNodeKey === "string" ? meta.stableNodeKey : undefined
  };
}

export function listTouchedChapterKeysFromDocChange(nodes: DocChangeNodeLike[]): string[] {
  const chapterKeys = new Set<string>();
  for (const node of nodes) {
    const meta = readStudioPopulateMetaFromContent(node.content);
    if (meta?.chapterKey) chapterKeys.add(meta.chapterKey);
  }
  return [...chapterKeys];
}

export function shouldPromoteChapterStatusToEdited(input: {
  currentStatus: ChapterStudioStatus | null | undefined;
  changeOrigin?: "user" | "populate";
}) {
  if (input.changeOrigin && input.changeOrigin !== "user") return false;
  return input.currentStatus === "populated";
}

