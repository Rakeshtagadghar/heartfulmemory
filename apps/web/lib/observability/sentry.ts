import * as Sentry from "@sentry/nextjs";
import { getSentryInitConfig, type SentryRuntime } from "../../../../lib/observability/sentryInit";
import {
  registerObservabilityAdapter,
  type ObservabilityAdapter,
  type SpanMetadata
} from "../../../../lib/observability/capture";
import { redactUnknown, sanitizeUrlQuery } from "../../../../lib/observability/redact";

const initializedRuntimes = new Set<SentryRuntime>();

function sanitizeEvent<T extends { request?: unknown; breadcrumbs?: unknown; extra?: unknown }>(event: T): T {
  const next = { ...event } as T & {
    request?: {
      data?: unknown;
      cookies?: unknown;
      headers?: unknown;
      url?: string;
      [key: string]: unknown;
    };
    breadcrumbs?: Array<{ data?: unknown; [key: string]: unknown }>;
    extra?: Record<string, unknown>;
  };
  if (next.request) {
    next.request = {
      ...next.request,
      data: undefined,
      cookies: undefined,
      headers: undefined,
      url: next.request.url ? sanitizeUrlQuery(next.request.url) : next.request.url
    };
  }

  if (Array.isArray(next.breadcrumbs)) {
    next.breadcrumbs = next.breadcrumbs.slice(-20).map((crumb) => ({
      ...crumb,
      data: redactUnknown(crumb.data) as Record<string, unknown>
    }));
  }

  if (next.extra) {
    next.extra = redactUnknown(next.extra) as Record<string, unknown>;
  }

  return next as T;
}

function createAdapter(): ObservabilityAdapter {
  return {
    captureException(error, payload) {
      return Sentry.captureException(error, {
        tags: payload.tags,
        contexts: payload.contexts,
        extra: payload.extra
      });
    },
    captureMessage(message, level, payload) {
      return Sentry.captureMessage(message, {
        level,
        tags: payload.tags,
        contexts: payload.contexts,
        extra: payload.extra
      });
    },
    withSpan<T>(span: SpanMetadata, fn: () => Promise<T> | T) {
      return Sentry.startSpan(
        {
          name: span.name,
          op: span.op,
          attributes: span.attributes
        },
        fn
      );
    }
  };
}

export function initSentryForRuntime(runtime: SentryRuntime) {
  if (initializedRuntimes.has(runtime)) return;
  initializedRuntimes.add(runtime);

  const config = getSentryInitConfig(runtime);
  if (!config.enabled || !config.dsn) {
    registerObservabilityAdapter(null);
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release ?? undefined,
    tracesSampleRate: config.tracesSampleRate,
    sendDefaultPii: false,
    debug: config.debug,
    beforeSend: sanitizeEvent
  });
  registerObservabilityAdapter(createAdapter());
}
