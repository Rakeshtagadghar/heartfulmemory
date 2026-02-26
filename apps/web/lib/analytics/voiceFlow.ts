"use client";

import { track } from "./client";

type Props = Record<string, string | number | boolean | null | undefined>;

export function trackVoiceRecordStart(props: Props) {
  track("voice_record_start", props);
}

export function trackVoiceRecordStop(props: Props) {
  track("voice_record_stop", props);
}

export function trackVoiceTranscribeStart(props: Props) {
  track("voice_transcribe_start", props);
}

export function trackVoiceTranscribeSuccess(props: Props) {
  track("voice_transcribe_success", props);
}

export function trackVoiceTranscribeError(props: Props) {
  track("voice_transcribe_error", props);
}

export function trackVoiceTranscriptEdit(props: Props) {
  track("voice_transcript_edit", props);
}

export function trackVoiceAnswerConfirm(props: Props) {
  track("voice_answer_confirm", props);
}

