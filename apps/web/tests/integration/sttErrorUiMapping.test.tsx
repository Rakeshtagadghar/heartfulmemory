import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VoiceErrors } from "../../components/voice/VoiceErrors";

describe("VoiceErrors mapping", () => {
  it("maps legacy provider timeout errors into the shared sprint 44 copy", () => {
    render(
      <VoiceErrors
        code="PROVIDER_TIMEOUT"
        onRetryTranscription={() => undefined}
        onSwitchToTyping={() => undefined}
      />
    );

    expect(screen.getByText("Transcription is taking too long")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry transcription" })).toBeInTheDocument();
  });

  it("shows microphone setup help for device problems", () => {
    const onOpenMicHelp = vi.fn();

    render(
      <VoiceErrors
        code="MIC_NOT_FOUND"
        onRecordAgain={() => undefined}
        onSwitchToTyping={() => undefined}
        onOpenMicHelp={onOpenMicHelp}
      />
    );

    expect(screen.getByText("No microphone detected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check microphone setup" })).toBeInTheDocument();
  });
});
