export type ClientAiProvider = "heuristic" | "groq";

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseProvider(value: string | undefined): ClientAiProvider {
  return value === "groq" ? "groq" : "heuristic";
}

export function getClientAiConfig() {
  return {
    providerDefault: parseProvider(readEnv("NEXT_PUBLIC_AI_PROVIDER_DEFAULT")),
    maxRetries: Number.parseInt(readEnv("NEXT_PUBLIC_AI_MAX_RETRIES") ?? "1", 10) || 1
  };
}
