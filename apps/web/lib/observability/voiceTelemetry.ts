"use client";

import * as Sentry from "@sentry/nextjs";
import { track } from "../analytics/client";
import { captureAppWarning } from "../../../../lib/observability/capture";
import { normalizeVoiceErrorCode, type VoiceErrorCode } from "../voice/errors/voiceErrorCodes";

type VoiceSurface = "wizard" | "studio";

type VoiceTelemetryContext = {
  surface: VoiceSurface;
  questionId?: string;
  chapterKey?: string;
  storybookId?: string;
  nodeId?: string;
};

function buildProps(code: VoiceErrorCode, context: VoiceTelemetryContext) {
  return {
    code,
    surface: context.surface,
    questionId: context.questionId,
    chapterKey: context.chapterKey,
    storybookId: context.storybookId,
    nodeId: context.nodeId
  };
}

function addVoiceBreadcrumb(message: string, level: "info" | "warning" | "error", data: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: "voice",
    message,
    level,
    data
  });
}

export function recordVoicePreflightFailed(codeInput: VoiceErrorCode | string, context: VoiceTelemetryContext) {
  const code = normalizeVoiceErrorCode(codeInput);
  const props = buildProps(code, context);
  addVoiceBreadcrumb("voice_preflight_failed", "warning", props);
  track("voice_preflight_failed", props);
  captureAppWarning("Voice preflight failed", {
    runtime: "client",
    flow: "voice_preflight",
    feature: context.surface,
    code,
    storybookId: context.storybookId,
    chapterKey: context.chapterKey,
    extra: {
      questionId: context.questionId ?? null,
      nodeId: context.nodeId ?? null
    }
  });
}

export function recordVoiceError(codeInput: VoiceErrorCode | string, context: VoiceTelemetryContext) {
  const code = normalizeVoiceErrorCode(codeInput);
  const props = buildProps(code, context);
  addVoiceBreadcrumb("voice_error", "error", props);
  track("voice_error", props);
  captureAppWarning("Voice flow error", {
    runtime: "client",
    flow: "voice_error",
    feature: context.surface,
    code,
    storybookId: context.storybookId,
    chapterKey: context.chapterKey,
    extra: {
      questionId: context.questionId ?? null,
      nodeId: context.nodeId ?? null
    }
  });
}

export function recordVoiceRecorderState(state: "start" | "stop", context: VoiceTelemetryContext) {
  const event = state === "start" ? "voice_record_start" : "voice_record_stop";
  addVoiceBreadcrumb(event, "info", {
    surface: context.surface,
    questionId: context.questionId ?? null,
    chapterKey: context.chapterKey ?? null,
    storybookId: context.storybookId ?? null,
    nodeId: context.nodeId ?? null
  });
}
