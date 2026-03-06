import { getVoiceErrorCopy } from "../../lib/voice/errors/voiceErrorCopy";
import { isMicSetupError, normalizeVoiceErrorCode } from "../../lib/voice/errors/voiceErrorCodes";
import { VoiceErrorCard, type VoiceErrorCardAction } from "./VoiceErrorCard";

export function VoiceErrors({
  code,
  onRetryTranscription,
  onRecordAgain,
  onSwitchToTyping,
  onOpenMicHelp
}: {
  code?: string | null;
  onRetryTranscription?: () => void;
  onRecordAgain?: () => void;
  onSwitchToTyping: () => void;
  onOpenMicHelp?: () => void;
}) {
  const normalized = normalizeVoiceErrorCode(code ?? null);
  const copy = getVoiceErrorCopy(normalized);
  const actions: VoiceErrorCardAction[] = [];

  if (onRetryTranscription) {
    actions.push({
      label: copy.primaryActionLabel === "Record again" ? "Retry transcription" : copy.primaryActionLabel,
      onClick: onRetryTranscription,
      variant: "primary"
    });
  }

  if (onRecordAgain) {
    actions.push({
      label: copy.primaryActionLabel === "Retry transcription" ? "Record again" : copy.primaryActionLabel,
      onClick: onRecordAgain,
      variant: onRetryTranscription ? "secondary" : "primary"
    });
  }

  if (onOpenMicHelp && isMicSetupError(normalized)) {
    actions.push({
      label: copy.helpActionLabel,
      onClick: onOpenMicHelp,
      variant: "ghost"
    });
  }

  actions.push({
    label: copy.secondaryActionLabel,
    onClick: onSwitchToTyping,
    variant: "secondary"
  });

  return (
    <VoiceErrorCard code={normalized} actions={actions} />
  );
}
