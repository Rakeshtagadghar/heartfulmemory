import { getSttConfig } from "../lib/config/stt";
import { getAiConfig } from "../lib/config/ai";

function readRawEnv(name: string) {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return maybeProcess.process?.env?.[name];
}

function readEnv(name: string) {
  const value = readRawEnv(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getConvexSttEnv() {
  const config = getSttConfig();
  return {
    ...config,
    providerDefault: config.providerDefault,
    groqApiKey: readEnv("GROQ_API_KEY"),
    elevenLabsApiKey: readEnv("ELEVENLABS_API_KEY"),
    actionTimeoutMs: Number.parseInt(readRawEnv("STT_ACTION_TIMEOUT_MS") ?? "45000", 10) || 45000
  };
}

export function getConvexAiEnv() {
  return getAiConfig();
}
