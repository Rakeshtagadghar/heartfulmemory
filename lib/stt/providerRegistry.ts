import type { SttProviderName } from "../config/stt";

export type SttTranscribeInput = {
  audioBase64: string;
  mimeType: string;
  language?: string | null;
  prompt?: string | null;
  provider: SttProviderName;
};

export type SttTranscribeOutput = {
  transcriptText: string;
  confidence?: number | null;
  durationMs?: number | null;
  providerRequestId?: string | null;
  raw?: Record<string, unknown> | null;
};

export type SttProvider = {
  name: SttProviderName;
  transcribe(input: Omit<SttTranscribeInput, "provider">): Promise<SttTranscribeOutput>;
};

export type SttProviderRegistry = {
  transcribe(input: SttTranscribeInput): Promise<SttTranscribeOutput>;
  listAvailableProviders(): SttProviderName[];
};

function base64ToBlob(input: string, mimeType: string) {
  const binary = globalThis.atob(input);
  if (binary.length === 0) {
    throw new Error("Invalid audio: empty audio bytes");
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType || "application/octet-stream" });
}

async function parseJsonSafe(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeMimeType(mimeType: string) {
  const normalized = (mimeType || "").toLowerCase();
  if (
    normalized.startsWith("audio/webm") ||
    normalized.startsWith("audio/ogg") ||
    normalized.startsWith("audio/wav") ||
    normalized.startsWith("audio/mpeg") ||
    normalized.startsWith("audio/mp4")
  ) {
    return normalized;
  }
  throw new Error(`Unsupported mime type: ${mimeType}`);
}

function createGroqProvider(apiKey: string): SttProvider {
  return {
    name: "groq",
    async transcribe(input) {
      const mimeType = normalizeMimeType(input.mimeType);
      const blob = base64ToBlob(input.audioBase64, mimeType);
      const fileExt =
        mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : mimeType.includes("mpeg") ? "mp3" : "webm";
      const form = new FormData();
      form.append("file", new File([blob], `answer.${fileExt}`, { type: mimeType }));
      form.append("model", "whisper-large-v3-turbo");
      if (input.language) form.append("language", input.language);
      if (input.prompt) form.append("prompt", input.prompt);
      form.append("response_format", "verbose_json");

      const response = await fetchWithTimeout("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: form
      });

      const body = await parseJsonSafe(response);
      if (!response.ok) {
        const providerMessage =
          (body && typeof body.error === "object" && body.error && "message" in body.error
            ? String((body.error as Record<string, unknown>).message)
            : null) || `Provider error (${response.status})`;
        if (response.status === 429) throw new Error(`Provider rate limit: ${providerMessage}`);
        throw new Error(`Provider error: ${providerMessage}`);
      }

      const transcriptText =
        typeof body?.text === "string"
          ? body.text
          : typeof body?.transcript === "string"
            ? body.transcript
            : "";

      return {
        transcriptText,
        durationMs:
          typeof body?.duration === "number" ? Math.round(body.duration * 1000) : null,
        raw: body ? { provider: "groq", hasText: typeof body.text === "string" } : null
      };
    }
  };
}

function createElevenLabsProvider(apiKey: string): SttProvider {
  return {
    name: "elevenlabs",
    async transcribe(input) {
      const mimeType = normalizeMimeType(input.mimeType);
      const blob = base64ToBlob(input.audioBase64, mimeType);
      const form = new FormData();
      form.append("file", new File([blob], "answer.webm", { type: mimeType }));
      if (input.language) form.append("language_code", input.language);

      // ElevenLabs STT endpoints vary by account feature/version. Keep this adapter minimal and swappable.
      const response = await fetchWithTimeout("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: {
          "xi-api-key": apiKey
        },
        body: form
      });

      const body = await parseJsonSafe(response);
      if (!response.ok) {
        const providerMessage =
          (body && typeof body.detail === "string" ? body.detail : null) ||
          (body && typeof body.message === "string" ? body.message : null) ||
          `Provider error (${response.status})`;
        if (response.status === 429) throw new Error(`Provider rate limit: ${providerMessage}`);
        throw new Error(`Provider error: ${providerMessage}`);
      }

      const transcriptText =
        typeof body?.text === "string"
          ? body.text
          : typeof body?.transcript === "string"
            ? body.transcript
            : "";

      return {
        transcriptText,
        raw: body ? { provider: "elevenlabs", hasText: typeof body.text === "string" } : null
      };
    }
  };
}

export function createSttProviderRegistry(config: {
  groqApiKey?: string | null;
  elevenLabsApiKey?: string | null;
}) : SttProviderRegistry {
  const providers = new Map<SttProviderName, SttProvider>();

  if (config.groqApiKey) {
    providers.set("groq", createGroqProvider(config.groqApiKey));
  }
  if (config.elevenLabsApiKey) {
    providers.set("elevenlabs", createElevenLabsProvider(config.elevenLabsApiKey));
  }

  return {
    async transcribe(input) {
      const provider = providers.get(input.provider);
      if (!provider) {
        throw new Error(`STT provider not configured: ${input.provider}`);
      }
      return provider.transcribe({
        audioBase64: input.audioBase64,
        mimeType: input.mimeType,
        language: input.language ?? null,
        prompt: input.prompt ?? null
      });
    },
    listAvailableProviders() {
      return Array.from(providers.keys());
    }
  };
}
