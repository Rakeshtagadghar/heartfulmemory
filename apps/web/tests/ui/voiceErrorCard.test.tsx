import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VoiceErrorCard } from "../../components/voice/VoiceErrorCard";

describe("VoiceErrorCard", () => {
  it("renders calm permission denied copy and actions", () => {
    const onRetry = vi.fn();
    const onHelp = vi.fn();

    render(
      <VoiceErrorCard
        code="MIC_PERMISSION_DENIED"
        actions={[
          { label: "Try again", onClick: onRetry, variant: "primary" },
          { label: "How to enable mic", onClick: onHelp, variant: "ghost" }
        ]}
      />
    );

    expect(screen.getByText("Turn on microphone access")).toBeInTheDocument();
    expect(screen.getByText(/Your browser blocked the microphone/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    fireEvent.click(screen.getByRole("button", { name: "How to enable mic" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it("renders provider timeout messaging from the shared copy map", () => {
    render(
      <VoiceErrorCard
        code="STT_TIMEOUT"
        actions={[{ label: "Retry transcription", onClick: () => undefined, variant: "primary" }]}
      />
    );

    expect(screen.getByText("Transcription is taking too long")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry transcription" })).toBeInTheDocument();
  });
});
