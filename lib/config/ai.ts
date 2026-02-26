import type { DraftNarrationLength } from "../../packages/shared/drafts/draftTypes";

export type AiProviderName = "heuristic" | "groq";

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseProvider(value: string | undefined): AiProviderName {
  return value === "groq" ? "groq" : "heuristic";
}

function parseLengthWordMap(value: string | undefined) {
  const fallback: Record<DraftNarrationLength, number> = {
    short: 350,
    medium: 700,
    long: 1100
  };
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return {
      short: typeof parsed.short === "number" && parsed.short > 0 ? Math.floor(parsed.short) : fallback.short,
      medium: typeof parsed.medium === "number" && parsed.medium > 0 ? Math.floor(parsed.medium) : fallback.medium,
      long: typeof parsed.long === "number" && parsed.long > 0 ? Math.floor(parsed.long) : fallback.long
    };
  } catch {
    return fallback;
  }
}

export function getAiConfig() {
  return {
    providerDefault: parseProvider(readEnv("AI_PROVIDER_DEFAULT")),
    maxRetries: parsePositiveInt(readEnv("AI_MAX_RETRIES"), 1),
    timeoutMs: parsePositiveInt(readEnv("AI_TIMEOUT_MS"), 45000),
    rateLimitPerUserPerMinute: parsePositiveInt(readEnv("AI_RATE_LIMIT_PER_USER"), 20),
    maxWordsByLength: parseLengthWordMap(readEnv("AI_MAX_WORDS_BY_LENGTH")),
    groqApiKey: readEnv("GROQ_API_KEY") ?? null
  };
}

export type AiConfig = ReturnType<typeof getAiConfig>;
