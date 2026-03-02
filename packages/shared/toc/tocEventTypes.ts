/**
 * Sprint 34 – ToC layout-affecting event types.
 *
 * Typed union for every event that can make the ToC stale.
 * Used by the staleness handler to decide when to invalidate the cache.
 */

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type TocLayoutEvent =
    | { type: "PROJECT_ORIENTATION_CHANGED"; orientation: "portrait" | "landscape" }
    | { type: "PAGE_ORIENTATION_CHANGED"; pageId: string; orientation: "inherit" | "portrait" | "landscape" }
    | { type: "REFLOW_MODE_TOGGLED"; enabled: boolean }
    | { type: "SAFE_AREA_DIMENSIONS_CHANGED"; widthPx: number; heightPx: number }
    | { type: "PAGE_REORDERED" }
    | { type: "PAGE_ADDED"; pageId: string }
    | { type: "PAGE_REMOVED"; pageId: string }
    | { type: "PAGE_TITLE_UPDATED"; pageId: string; title: string }
    | { type: "PAGE_TOC_VISIBILITY_UPDATED"; pageId: string; showInToc: boolean }
    | { type: "TEMPLATE_CHANGED" }
    | { type: "TYPOGRAPHY_CHANGED" }
    | { type: "PAGINATION_COMPUTED"; paginationVersion: string; pageIdToPageNumberMap: Record<string, number> };

/**
 * All event types that are considered "layout-affecting" and cause the ToC
 * render cache to become stale. PAGINATION_COMPUTED is intentionally excluded
 * because it is the event that _resolves_ staleness, not causes it.
 */
export const LAYOUT_AFFECTING_EVENT_TYPES: ReadonlyArray<TocLayoutEvent["type"]> = [
    "PROJECT_ORIENTATION_CHANGED",
    "PAGE_ORIENTATION_CHANGED",
    "REFLOW_MODE_TOGGLED",
    "SAFE_AREA_DIMENSIONS_CHANGED",
    "PAGE_REORDERED",
    "PAGE_ADDED",
    "PAGE_REMOVED",
    "PAGE_TITLE_UPDATED",
    "PAGE_TOC_VISIBILITY_UPDATED",
    "TEMPLATE_CHANGED",
    "TYPOGRAPHY_CHANGED",
] as const;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export type TocStaleAction =
    | { action: "mark_stale" }
    | { action: "update_cache"; paginationVersion: string; pageIdToPageNumberMap: Record<string, number> };

/**
 * Given a `TocLayoutEvent`, returns the action the ToC subsystem should take.
 *
 * - Layout-affecting events → `mark_stale` (the cache should be invalidated).
 * - `PAGINATION_COMPUTED`   → `update_cache` (write the fresh numbers).
 */
export function handleTocLayoutEvent(event: TocLayoutEvent): TocStaleAction {
    if (event.type === "PAGINATION_COMPUTED") {
        return {
            action: "update_cache",
            paginationVersion: event.paginationVersion,
            pageIdToPageNumberMap: event.pageIdToPageNumberMap,
        };
    }

    return { action: "mark_stale" };
}
