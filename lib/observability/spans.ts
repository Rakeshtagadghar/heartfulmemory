import type { AppCaptureContext } from "./sentryContext";
import { getObservabilityAdapter } from "./capture";

function toAttributes(context: AppCaptureContext) {
  const attributes: Record<string, string | number | boolean> = {
    flow: context.flow
  };
  if (context.feature) attributes.feature = context.feature;
  if (context.provider) attributes.provider = context.provider;
  if (context.mode) attributes.mode = context.mode;
  if (context.code) attributes.errorCode = context.code;
  if (context.storybookId) attributes.storybookId = context.storybookId;
  if (context.chapterKey) attributes.chapterKey = context.chapterKey;
  if (context.chapterInstanceId) attributes.chapterInstanceId = context.chapterInstanceId;
  return attributes;
}

export async function withSentrySpan<T>(
  name: string,
  context: AppCaptureContext,
  fn: () => Promise<T> | T
) {
  const active = getObservabilityAdapter();
  if (!active?.withSpan) return await fn();
  return await active.withSpan(
    {
      name,
      op: context.flow,
      attributes: toAttributes(context)
    },
    fn
  );
}
