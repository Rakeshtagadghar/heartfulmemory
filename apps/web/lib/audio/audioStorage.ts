export type AudioStorageDecision = "discard_after_transcription";

export function getAudioStorageDecision(): AudioStorageDecision {
  return "discard_after_transcription";
}

export async function storeOrDiscardAudioForVoiceAnswer(blob: Blob) {
  // Sprint 18 privacy-first strategy: do not persist audio.
  void blob;
  return { audioRef: null as string | null, stored: false as const };
}
