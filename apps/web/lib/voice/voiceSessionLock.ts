/**
 * Module-level voice session mutex.
 * Ensures only one recording is active at a time (wizard OR studio).
 */
type VoiceContext = "wizard" | "studio";

let activeContext: VoiceContext | null = null;

export function acquireVoiceSession(context: VoiceContext): boolean {
  if (activeContext !== null && activeContext !== context) return false;
  activeContext = context;
  return true;
}

export function releaseVoiceSession(context: VoiceContext): void {
  if (activeContext === context) activeContext = null;
}

export function getActiveVoiceContext(): VoiceContext | null {
  return activeContext;
}
