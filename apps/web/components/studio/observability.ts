"use client";

import * as Sentry from "@sentry/nextjs";
import { captureAppError, captureAppWarning } from "../../../../lib/observability/capture";
import { withSentrySpan } from "../../../../lib/observability/spans";
import {
  buildEditorMilestoneBreadcrumb,
  type EditorMilestoneEvent
} from "../../../../packages/editor/observability/editorBreadcrumbs";

export type StudioCaptureContext = {
  flow: string;
  feature?: string;
  code?: string;
  provider?: string;
  mode?: string;
  storybookId?: string;
  chapterKey?: string;
  chapterInstanceId?: string;
  pageId?: string;
  nodeType?: string;
  selectionCount?: number;
  durationMs?: number;
  extra?: Record<string, unknown>;
};

function buildStudioExtra(context: StudioCaptureContext) {
  const base: Record<string, unknown> = {
    pageId: context.pageId ?? null,
    nodeType: context.nodeType ?? null,
    selectionCount: context.selectionCount ?? null,
    durationMs: context.durationMs ?? null
  };
  if (context.extra) {
    return {
      ...base,
      ...context.extra
    };
  }
  return base;
}

function milestoneFromContext(
  category: EditorMilestoneEvent["category"],
  action: string,
  context: StudioCaptureContext,
  status?: EditorMilestoneEvent["status"]
): EditorMilestoneEvent {
  return {
    category,
    action,
    pageId: context.pageId ?? null,
    nodeType: context.nodeType ?? null,
    selectionCount: context.selectionCount,
    durationMs: context.durationMs,
    status,
    mode: context.mode,
    provider: context.provider
  };
}

export function recordStudioMilestone(
  category: EditorMilestoneEvent["category"],
  action: string,
  context: StudioCaptureContext,
  status?: EditorMilestoneEvent["status"]
) {
  const breadcrumb = buildEditorMilestoneBreadcrumb(
    milestoneFromContext(category, action, context, status)
  );
  if (!breadcrumb) return;
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: "info",
    data: breadcrumb.data
  });
}

export function captureStudioError(error: unknown, context: StudioCaptureContext) {
  return captureAppError(error, {
    runtime: "client",
    flow: context.flow,
    feature: context.feature ?? "studio",
    code: context.code,
    provider: context.provider,
    mode: context.mode,
    storybookId: context.storybookId,
    chapterKey: context.chapterKey,
    chapterInstanceId: context.chapterInstanceId,
    extra: buildStudioExtra(context)
  });
}

export function captureStudioWarning(message: string, context: StudioCaptureContext) {
  return captureAppWarning(message, {
    runtime: "client",
    flow: context.flow,
    feature: context.feature ?? "studio",
    code: context.code,
    provider: context.provider,
    mode: context.mode,
    storybookId: context.storybookId,
    chapterKey: context.chapterKey,
    chapterInstanceId: context.chapterInstanceId,
    extra: buildStudioExtra(context)
  });
}

export async function withStudioSpan<T>(
  name: string,
  context: StudioCaptureContext,
  fn: () => Promise<T> | T
) {
  return await withSentrySpan(
    name,
    {
      flow: context.flow,
      feature: context.feature ?? "studio",
      code: context.code,
      provider: context.provider,
      mode: context.mode,
      storybookId: context.storybookId,
      chapterKey: context.chapterKey,
      chapterInstanceId: context.chapterInstanceId,
      extra: {
        pageId: context.pageId ?? null,
        nodeType: context.nodeType ?? null,
        selectionCount: context.selectionCount ?? null
      }
    },
    fn
  );
}
