"use client";

import { VoiceVisualizer } from "react-voice-visualizer";
import type { useVoiceVisualizer } from "react-voice-visualizer";

type Controls = ReturnType<typeof useVoiceVisualizer>;

type Props = {
  controls: Controls;
  visible: boolean;
  height?: number;
  barColor?: string;
};

export function VoiceWaveform({
  controls,
  visible,
  height = 64,
  barColor = "#e879f9"
}: Props) {
  if (!visible) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl">
      <VoiceVisualizer
        controls={controls}
        height={height}
        width="100%"
        backgroundColor="transparent"
        mainBarColor={barColor}
        barWidth={3}
        speed={3}
        isControlPanelShown={false}
      />
    </div>
  );
}
