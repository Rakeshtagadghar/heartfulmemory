export type EditorBreadcrumbCategory =
  | "ui_action"
  | "api_call"
  | "editor_action"
  | "export_step";

export type EditorMilestoneEvent = {
  category: EditorBreadcrumbCategory;
  action: string;
  pageId?: string | null;
  nodeType?: string | null;
  selectionCount?: number;
  durationMs?: number;
  status?: "start" | "success" | "failed";
  mode?: string;
  provider?: string;
};

type InternalBreadcrumb = {
  category: EditorBreadcrumbCategory;
  message: string;
  data: Record<string, string | number | boolean | null>;
};

const MAX_RECENT_BREADCRUMBS = 40;
const THROTTLE_WINDOW_MS = 900;
const recentMilestones = new Map<string, number>();
const recentBreadcrumbs: InternalBreadcrumb[] = [];

function sanitizeKey(value: string) {
  return value.trim().replaceAll(/\s+/g, "_").replaceAll(/[^a-zA-Z0-9:_-]/g, "_");
}

function shouldRecordMilestone(key: string, now = Date.now()) {
  const previous = recentMilestones.get(key) ?? 0;
  if (now - previous < THROTTLE_WINDOW_MS) return false;
  recentMilestones.set(key, now);
  if (recentMilestones.size > 200) {
    const cutoff = now - THROTTLE_WINDOW_MS * 2;
    for (const [itemKey, itemTime] of recentMilestones.entries()) {
      if (itemTime < cutoff) recentMilestones.delete(itemKey);
    }
  }
  return true;
}

export function buildEditorMilestoneBreadcrumb(event: EditorMilestoneEvent): InternalBreadcrumb | null {
  const action = sanitizeKey(event.action);
  const pageId = event.pageId ? sanitizeKey(event.pageId) : null;
  const nodeType = event.nodeType ? sanitizeKey(event.nodeType) : null;
  const throttleKey = `${event.category}:${action}:${pageId ?? "none"}:${nodeType ?? "none"}:${event.status ?? "steady"}`;
  if (!shouldRecordMilestone(throttleKey)) return null;

  const data: Record<string, string | number | boolean | null> = {
    action,
    pageId,
    nodeType,
    selectionCount: event.selectionCount ?? null,
    durationMs: event.durationMs ?? null,
    status: event.status ?? null,
    mode: event.mode ? sanitizeKey(event.mode) : null,
    provider: event.provider ? sanitizeKey(event.provider) : null
  };

  const breadcrumb: InternalBreadcrumb = {
    category: event.category,
    message: action,
    data
  };
  recentBreadcrumbs.push(breadcrumb);
  if (recentBreadcrumbs.length > MAX_RECENT_BREADCRUMBS) {
    recentBreadcrumbs.shift();
  }
  return breadcrumb;
}

export function getRecentEditorMilestones(limit = 10) {
  const safeLimit = Math.max(1, Math.min(40, Math.floor(limit)));
  return recentBreadcrumbs.slice(-safeLimit);
}
