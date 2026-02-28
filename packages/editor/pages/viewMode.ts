export const pageViewModes = ["single_page", "continuous"] as const;

export type PageViewMode = (typeof pageViewModes)[number];

const PAGE_VIEW_MODE_STORAGE_PREFIX = "memorioso:studio:page-view-mode:";

export function isPageViewMode(value: unknown): value is PageViewMode {
  return typeof value === "string" && pageViewModes.includes(value as PageViewMode);
}

export function getPageViewModeStorageKey(storybookId: string) {
  return `${PAGE_VIEW_MODE_STORAGE_PREFIX}${storybookId}`;
}

export function readStoredPageViewMode(storybookId: string): PageViewMode | null {
  if (typeof globalThis === "undefined" || !globalThis.localStorage) return null;
  const raw = globalThis.localStorage.getItem(getPageViewModeStorageKey(storybookId));
  return isPageViewMode(raw) ? raw : null;
}

export function writeStoredPageViewMode(storybookId: string, mode: PageViewMode) {
  if (typeof globalThis === "undefined" || !globalThis.localStorage) return;
  globalThis.localStorage.setItem(getPageViewModeStorageKey(storybookId), mode);
}
