export type VoiceSessionState = "idle" | "listening" | "processing" | "success" | "error";

export function isActiveState(state: VoiceSessionState): boolean {
  return state === "listening" || state === "processing";
}
