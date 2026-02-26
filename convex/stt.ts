"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { getConvexSttEnv } from "./env";
import { mapSttError } from "../lib/stt/errorMap";
import { createSttProviderRegistry } from "../lib/stt/providerRegistry";

const providerValidator = v.union(v.literal("groq"), v.literal("elevenlabs"));
const softRateWindowMs = 60 * 60 * 1000;
const sttActionSoftRateByUser = new Map<string, number[]>();

async function requireActionUser(ctx: ActionCtx, explicitSubject?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject || identity?.tokenIdentifier || explicitSubject || null;
  if (!subject) {
    throw new Error("Unauthorized");
  }
  return { subject };
}

function checkAndRecordSoftRateLimit(subject: string, limitPerWindow: number) {
  if (limitPerWindow <= 0) return { allowed: true as const, remaining: null as number | null };
  const now = Date.now();
  const existing = sttActionSoftRateByUser.get(subject) ?? [];
  const recent = existing.filter((timestamp) => now - timestamp < softRateWindowMs);
  if (recent.length >= limitPerWindow) {
    sttActionSoftRateByUser.set(subject, recent);
    return { allowed: false as const, remaining: 0 };
  }
  recent.push(now);
  sttActionSoftRateByUser.set(subject, recent);
  return { allowed: true as const, remaining: Math.max(0, limitPerWindow - recent.length) };
}

export const transcribe = action({
  args: {
    viewerSubject: v.optional(v.string()),
    audioBase64: v.string(),
    mimeType: v.string(),
    durationMs: v.optional(v.union(v.number(), v.null())),
    language: v.optional(v.union(v.string(), v.null())),
    prompt: v.optional(v.union(v.string(), v.null())),
    provider: v.optional(providerValidator)
  },
  handler: async (ctx, args) => {
    const viewer = await requireActionUser(ctx, args.viewerSubject);
    const env = getConvexSttEnv();
    const rateCheck = checkAndRecordSoftRateLimit(viewer.subject, env.rateLimitPerUserSoft);
    if (!rateCheck.allowed) {
      return {
        ok: false as const,
        errorCode: "PROVIDER_RATE_LIMIT" as const,
        message: "Voice transcription rate limit reached. Please try again later.",
        retryable: true
      };
    }
    const maxDurationMs = env.maxSecondsPerAnswer * 1000;
    if (typeof args.durationMs === "number" && args.durationMs > maxDurationMs) {
      return {
        ok: false as const,
        errorCode: "INVALID_AUDIO" as const,
        message: `Recording exceeds max duration of ${env.maxSecondsPerAnswer} seconds.`,
        retryable: false
      };
    }

    const provider = args.provider ?? env.providerDefault;
    const registry = createSttProviderRegistry({
      groqApiKey: env.groqApiKey,
      elevenLabsApiKey: env.elevenLabsApiKey
    });

    try {
      const result = await registry.transcribe({
        audioBase64: args.audioBase64,
        mimeType: args.mimeType,
        language: args.language ?? env.languageDefault,
        prompt: args.prompt ?? null,
        provider
      });

      return {
        ok: true as const,
        provider,
        transcriptText: result.transcriptText,
        confidence: result.confidence ?? null,
        durationMs: result.durationMs ?? null,
        providerRequestId: result.providerRequestId ?? null,
        raw: result.raw ?? null
      };
    } catch (error) {
      const mapped = mapSttError(error);
      return {
        ok: false as const,
        errorCode: mapped.code,
        message: mapped.message,
        retryable: mapped.retryable
      };
    }
  }
});

export const healthcheck = action({
  args: {
    provider: v.optional(providerValidator)
  },
  handler: async (_ctx, args) => {
    const env = getConvexSttEnv();
    const registry = createSttProviderRegistry({
      groqApiKey: env.groqApiKey,
      elevenLabsApiKey: env.elevenLabsApiKey
    });
    const selectedProvider = args.provider ?? env.providerDefault;
    const available = registry.listAvailableProviders();

    return {
      ok: available.includes(selectedProvider),
      provider: selectedProvider,
      availableProviders: available,
      config: {
        providerDefault: env.providerDefault,
        maxSecondsPerAnswer: env.maxSecondsPerAnswer,
        languageDefault: env.languageDefault,
        enableVoiceInput: env.enableVoiceInput,
        enableAudioStorage: env.enableAudioStorage
      }
    };
  }
});
