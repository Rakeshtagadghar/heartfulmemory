type OrderablePage = {
  id: string;
  order_index: number;
};

export type PageUiStateV1 = {
  title?: string;
  isHidden?: boolean;
  isLocked?: boolean;
};

export type PageUiStateMapV1 = Record<string, PageUiStateV1>;

export function normalizePageUiStateMapV1(input: unknown): PageUiStateMapV1 {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const next: PageUiStateMapV1 = {};
  for (const [pageId, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const state = raw as Record<string, unknown>;
    next[pageId] = {
      title: typeof state.title === "string" ? state.title : undefined,
      isHidden: typeof state.isHidden === "boolean" ? state.isHidden : undefined,
      isLocked: typeof state.isLocked === "boolean" ? state.isLocked : undefined
    };
  }
  return next;
}

export function upsertPageUiStateV1(
  current: PageUiStateMapV1,
  pageId: string,
  patch: Partial<PageUiStateV1>
): PageUiStateMapV1 {
  const merged = {
    ...(current[pageId] ?? {}),
    ...patch
  };
  return {
    ...current,
    [pageId]: merged
  };
}

export function reorderPagesByMove<T extends OrderablePage>(
  pages: T[],
  pageId: string,
  direction: -1 | 1
): T[] {
  const sorted = [...pages].sort((a, b) => a.order_index - b.order_index);
  const index = sorted.findIndex((page) => page.id === pageId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return sorted;
  const next = [...sorted];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next.map((page, idx) => ({ ...page, order_index: idx }));
}

export function insertPageIdAfter(orderedIds: string[], pageIdToInsert: string, afterPageId: string) {
  const next = orderedIds.filter((id) => id !== pageIdToInsert);
  const anchorIndex = next.indexOf(afterPageId);
  if (anchorIndex < 0) {
    next.push(pageIdToInsert);
    return next;
  }
  next.splice(anchorIndex + 1, 0, pageIdToInsert);
  return next;
}
