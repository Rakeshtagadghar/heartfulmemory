"use node";

import { captureAppError, captureAppWarning } from "../../lib/observability/capture";
import { withSentrySpan } from "../../lib/observability/spans";

type ConvexContext = {
  flow: string;
  feature?: string;
  code?: string;
  provider?: string;
  mode?: string;
  storybookId?: string;
  chapterKey?: string;
  chapterInstanceId?: string;
  extra?: Record<string, unknown>;
};

export function captureConvexError(error: unknown, context: ConvexContext) {
  return captureAppError(error, {
    ...context,
    runtime: "convex",
    feature: context.feature ?? "convex"
  });
}

export function captureConvexWarning(message: string, context: ConvexContext) {
  return captureAppWarning(message, {
    ...context,
    runtime: "convex",
    feature: context.feature ?? "convex"
  });
}

export async function withConvexSpan<T>(name: string, context: ConvexContext, fn: () => Promise<T> | T) {
  return await withSentrySpan(
    name,
    {
      ...context,
      feature: context.feature ?? "convex"
    },
    fn
  );
}
