import type { AppCaptureContext, AppCapturePayload } from "./sentryContext";
import { buildCapturePayload } from "./sentryContext";
import { sanitizeErrorMessage } from "./redact";
import { createCorrelationId } from "./correlation";

type CaptureLevel = "error" | "warning" | "info";

export type SpanMetadata = {
  name: string;
  op: string;
  attributes: Record<string, string | number | boolean>;
};

export type ObservabilityAdapter = {
  captureException(error: Error, payload: AppCapturePayload): string | undefined;
  captureMessage(message: string, level: CaptureLevel, payload: AppCapturePayload): string | undefined;
  withSpan?<T>(span: SpanMetadata, fn: () => Promise<T> | T): Promise<T> | T;
};

let adapter: ObservabilityAdapter | null = null;

export function registerObservabilityAdapter(next: ObservabilityAdapter | null) {
  adapter = next;
}

export function getObservabilityAdapter() {
  return adapter;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return new Error(sanitizeErrorMessage(error.message));
  }
  if (typeof error === "string") return new Error(sanitizeErrorMessage(error));
  return new Error("Unknown error");
}

function consoleFallback(level: CaptureLevel, message: string, payload: AppCapturePayload) {
  if (typeof console === "undefined") return;
  const line = `[observability:${level}] ${message}`;
  if (level === "error") console.error(line, payload);
  else if (level === "warning") console.warn(line, payload);
  else console.info(line, payload);
}

export function captureAppError(
  error: unknown,
  context: AppCaptureContext & { runtime?: "client" | "server" | "edge" | "convex" }
) {
  const runtime = context.runtime ?? "server";
  const payload = buildCapturePayload(context, runtime);
  const normalized = normalizeError(error);
  const id = adapter?.captureException(normalized, payload);
  if (!id) consoleFallback("error", normalized.message, payload);
  return id ?? null;
}

export function captureAppWarning(
  message: string,
  context: AppCaptureContext & { runtime?: "client" | "server" | "edge" | "convex" }
) {
  const runtime = context.runtime ?? "server";
  const payload = buildCapturePayload(context, runtime);
  const normalized = sanitizeErrorMessage(message);
  const id = adapter?.captureMessage(normalized, "warning", payload);
  if (!id) consoleFallback("warning", normalized, payload);
  return id ?? null;
}

export function captureAppErrorWithCorrelation(
  error: unknown,
  context: AppCaptureContext & { runtime?: "client" | "server" | "edge" | "convex" }
) {
  const correlationId = createCorrelationId();
  const eventId = captureAppError(error, {
    ...context,
    extra: {
      ...(context.extra ?? {}),
      correlationId
    }
  });
  return { correlationId, eventId };
}
