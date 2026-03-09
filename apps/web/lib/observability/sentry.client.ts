import * as Sentry from "@sentry/nextjs";
import { replayIntegration } from "@sentry/browser";
import { getSentryInitConfig } from "../../../../lib/observability/sentryInit";
import { registerObservabilityAdapter } from "../../../../lib/observability/capture";
import { createAdapter, sanitizeEvent } from "./sentry";

let initialized = false;

export function initClientSentry() {
  if (initialized) return;
  initialized = true;

  const config = getSentryInitConfig("client");
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
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      replayIntegration()
    ],
    enableLogs: true,
    replaysSessionSampleRate: 1,
    replaysOnErrorSampleRate: 1,
    beforeSend: sanitizeEvent
  });

  registerObservabilityAdapter(createAdapter());
}
