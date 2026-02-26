import { anyApi, convexAction, getConvexUrl } from "../convex/ops";
import type { DataResult } from "../data/_shared";

export type SttTranscribeResult =
  | {
      ok: true;
      provider: "groq" | "elevenlabs";
      transcriptText: string;
      confidence: number | null;
      durationMs: number | null;
      providerRequestId: string | null;
      raw: Record<string, unknown> | null;
    }
  | {
      ok: false;
      errorCode:
        | "MIC"
        | "NETWORK"
        | "PROVIDER_RATE_LIMIT"
        | "PROVIDER_TIMEOUT"
        | "PROVIDER_ERROR"
        | "UNSUPPORTED_MIME"
        | "INVALID_AUDIO"
        | "NOT_CONFIGURED"
        | "UNKNOWN";
      message: string;
      retryable: boolean;
    };

export async function transcribeAudioForUser(
  viewerSubject: string,
  input: {
    audioBase64: string;
    mimeType: string;
    durationMs?: number | null;
    language?: string | null;
    prompt?: string | null;
    provider?: "groq" | "elevenlabs";
  }
): Promise<DataResult<SttTranscribeResult>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexAction<SttTranscribeResult>(anyApi.stt.transcribe, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}
