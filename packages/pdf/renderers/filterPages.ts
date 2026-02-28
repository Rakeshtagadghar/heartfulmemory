import { normalizePageUiStateMapV1 } from "../../editor/model/pageOps";

type PageLike = { id: string; is_hidden?: boolean };
type FrameLike = { page_id: string };

type StorybookSettingsLike = Record<string, unknown>;

export function deriveHiddenPageIdsFromSettings(settings: StorybookSettingsLike) {
  const studioDocMeta =
    settings.studioDocMeta && typeof settings.studioDocMeta === "object" && !Array.isArray(settings.studioDocMeta)
      ? (settings.studioDocMeta as Record<string, unknown>)
      : {};
  const pageUiState = normalizePageUiStateMapV1(studioDocMeta.pageUiStateV1);
  return new Set(
    Object.entries(pageUiState)
      .filter(([, value]) => Boolean(value.isHidden))
      .map(([pageId]) => pageId)
  );
}

export function deriveHiddenPageIdsFromPages<TPage extends PageLike>(pages: TPage[]) {
  return new Set(
    pages
      .filter((page) => Boolean(page.is_hidden))
      .map((page) => page.id)
  );
}

export function filterHiddenPagesFromExport<TPage extends PageLike, TFrame extends FrameLike>(input: {
  pages: TPage[];
  frames: TFrame[];
  settings: StorybookSettingsLike;
  includeHiddenPages: boolean;
}) {
  if (input.includeHiddenPages) {
    return {
      pages: input.pages,
      frames: input.frames,
      excludedPageIds: [] as string[]
    };
  }
  const hiddenFromPages = deriveHiddenPageIdsFromPages(input.pages);
  const hiddenPageIds = hiddenFromPages.size > 0 ? hiddenFromPages : deriveHiddenPageIdsFromSettings(input.settings);
  if (hiddenPageIds.size === 0) {
    return {
      pages: input.pages,
      frames: input.frames,
      excludedPageIds: [] as string[]
    };
  }
  return {
    pages: input.pages.filter((page) => !hiddenPageIds.has(page.id)),
    frames: input.frames.filter((frame) => !hiddenPageIds.has(frame.page_id)),
    excludedPageIds: Array.from(hiddenPageIds)
  };
}
