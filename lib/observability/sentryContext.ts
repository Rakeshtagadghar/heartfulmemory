import { clampString, redactUnknown } from "./redact";

export type AppCaptureContext = {
  flow: string;
  feature?: string;
  code?: string;
  provider?: string;
  mode?: string;
  storybookId?: string;
  chapterKey?: string;
  chapterInstanceId?: string;
  billingEntitlement?: string;
  route?: string;
  extra?: Record<string, unknown>;
};

export type AppCapturePayload = {
  tags: Record<string, string>;
  contexts: Record<string, Record<string, unknown>>;
  extra: Record<string, unknown>;
};

function toTag(value: string | undefined, fallback = "unknown") {
  const normalized = (value ?? fallback).trim();
  if (!normalized) return fallback;
  return clampString(normalized.replaceAll(/[^a-zA-Z0-9:_-]/g, "_"), 80);
}

export function buildCapturePayload(
  context: AppCaptureContext,
  runtime: "client" | "server" | "edge" | "convex"
): AppCapturePayload {
  const tags: Record<string, string> = {
    flow: toTag(context.flow),
    feature: toTag(context.feature, "app"),
    mode: toTag(context.mode),
    provider: toTag(context.provider),
    runtime: toTag(runtime)
  };
  if (context.code) tags.errorCode = toTag(context.code);

  const contexts: Record<string, Record<string, unknown>> = {
    storybook: {
      storybookId: context.storybookId ?? null
    },
    chapter: {
      chapterKey: context.chapterKey ?? null,
      chapterInstanceId: context.chapterInstanceId ?? null
    }
  };
  if (context.billingEntitlement) {
    contexts.billingEntitlement = { value: clampString(context.billingEntitlement, 60) };
  }

  const extraBase: Record<string, unknown> = {};
  if (context.route) extraBase.route = clampString(context.route, 180);
  const extra = {
    ...extraBase,
    ...(context.extra ?? {})
  };

  return {
    tags,
    contexts,
    extra: (redactUnknown(extra) as Record<string, unknown>) ?? {}
  };
}
