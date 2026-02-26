export type ClientSttProvider = "groq" | "elevenlabs";

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseBool(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseIntSafe(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseProvider(value: string | undefined, fallback: ClientSttProvider): ClientSttProvider {
  return value === "elevenlabs" || value === "groq" ? value : fallback;
}

export function getClientSttConfig() {
  return {
    providerDefault: parseProvider(readEnv("NEXT_PUBLIC_STT_PROVIDER_DEFAULT"), "groq"),
    maxSecondsPerAnswer: parseIntSafe(readEnv("NEXT_PUBLIC_STT_MAX_SECONDS_PER_ANSWER"), 180),
    languageDefault: readEnv("NEXT_PUBLIC_STT_LANGUAGE_DEFAULT") ?? "en",
    enableVoiceInput: parseBool(readEnv("NEXT_PUBLIC_ENABLE_VOICE_INPUT"), true),
    enableAudioStorage: parseBool(readEnv("NEXT_PUBLIC_ENABLE_AUDIO_STORAGE"), false)
  };
}

