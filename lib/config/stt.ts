export type SttProviderName = "groq" | "elevenlabs";

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseProvider(value: string | undefined, fallback: SttProviderName): SttProviderName {
  return value === "elevenlabs" || value === "groq" ? value : fallback;
}

export function getSttConfig() {
  return {
    providerDefault: parseProvider(readEnv("STT_PROVIDER_DEFAULT"), "groq"),
    maxSecondsPerAnswer: parsePositiveInt(readEnv("STT_MAX_SECONDS_PER_ANSWER"), 180),
    languageDefault: readEnv("STT_LANGUAGE_DEFAULT") ?? "en",
    rateLimitPerUserSoft: parsePositiveInt(readEnv("STT_RATE_LIMIT_PER_USER"), 60),
    enableVoiceInput: parseBoolean(readEnv("NEXT_PUBLIC_ENABLE_VOICE_INPUT") ?? readEnv("ENABLE_VOICE_INPUT"), true),
    enableAudioStorage: parseBoolean(
      readEnv("NEXT_PUBLIC_ENABLE_AUDIO_STORAGE") ?? readEnv("ENABLE_AUDIO_STORAGE"),
      false
    )
  };
}

export type SttConfig = ReturnType<typeof getSttConfig>;

