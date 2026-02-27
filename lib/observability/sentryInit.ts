export type SentryRuntime = "client" | "server" | "edge" | "convex";

export type SentryInitConfig = {
  enabled: boolean;
  dsn: string | null;
  environment: string;
  release: string | null;
  tracesSampleRate: number;
  debug: boolean;
};

function readRawEnv(name: string) {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return maybeProcess.process?.env?.[name];
}

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = readRawEnv(key);
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return null;
}

function parseRate(raw: string | null, fallback: number) {
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(1, parsed));
}

export function getSentryInitConfig(runtime: SentryRuntime): SentryInitConfig {
  const environment =
    readEnv("SENTRY_ENVIRONMENT", "NEXT_PUBLIC_SENTRY_ENVIRONMENT") ??
    readEnv("VERCEL_ENV") ??
    readEnv("NODE_ENV") ??
    "development";
  const isLocal = environment === "development";

  const dsn =
    runtime === "client"
      ? readEnv("NEXT_PUBLIC_SENTRY_DSN", "SENTRY_DSN")
      : readEnv("SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN");
  const release = readEnv(
    "SENTRY_RELEASE",
    "NEXT_PUBLIC_SENTRY_RELEASE",
    "VERCEL_GIT_COMMIT_SHA",
    "GITHUB_SHA"
  );

  const explicitEnable = readEnv("SENTRY_ENABLED", "NEXT_PUBLIC_SENTRY_ENABLED");
  const enabled = Boolean(dsn) && (explicitEnable === "1" || explicitEnable === "true" || !isLocal);

  return {
    enabled,
    dsn,
    environment,
    release,
    tracesSampleRate: parseRate(readEnv("SENTRY_TRACES_SAMPLE_RATE", "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"), isLocal ? 0.05 : 0.15),
    debug: readEnv("SENTRY_DEBUG") === "1"
  };
}
