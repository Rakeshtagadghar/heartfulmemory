declare module "react-voice-visualizer" {
  import type {
    ComponentType,
    Dispatch,
    MutableRefObject,
    SetStateAction,
  } from "react";

  export interface Controls {
    audioRef: MutableRefObject<HTMLAudioElement | null>;
    isRecordingInProgress: boolean;
    isPausedRecording: boolean;
    audioData: Uint8Array;
    recordingTime: number;
    mediaRecorder: MediaRecorder | null;
    duration: number;
    currentAudioTime: number;
    audioSrc: string;
    isPausedRecordedAudio: boolean;
    isProcessingRecordedAudio: boolean;
    isCleared: boolean;
    isAvailableRecordedAudio: boolean;
    recordedBlob: Blob | null;
    bufferFromRecordedBlob: AudioBuffer | null;
    formattedDuration: string;
    formattedRecordingTime: string;
    formattedRecordedAudioCurrentTime: string;
    startRecording: () => void;
    togglePauseResume: () => void;
    startAudioPlayback: () => void;
    stopAudioPlayback: () => void;
    stopRecording: () => void;
    saveAudioFile: () => void;
    clearCanvas: () => void;
    setCurrentAudioTime: Dispatch<SetStateAction<number>>;
    error: Error | null;
    isProcessingOnResize: boolean;
    isProcessingStartRecording: boolean;
    isPreloadedBlob: boolean;
    setPreloadedAudioBlob: (blob: Blob) => void;
    _setIsProcessingAudioOnComplete: Dispatch<SetStateAction<boolean>>;
    _setIsProcessingOnResize: Dispatch<SetStateAction<boolean>>;
  }

  export interface UseVoiceVisualizerParams {
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    onPausedRecording?: () => void;
    onResumedRecording?: () => void;
    onClearCanvas?: () => void;
    onEndAudioPlayback?: () => void;
    onStartAudioPlayback?: () => void;
    onPausedAudioPlayback?: () => void;
    onResumedAudioPlayback?: () => void;
    onErrorPlayingAudio?: (error: Error) => void;
    shouldHandleBeforeUnload?: boolean;
  }

  export interface VoiceVisualizerProps {
    controls: Controls;
    height?: number | string;
    width?: number | string;
    backgroundColor?: string;
    mainBarColor?: string;
    secondaryBarColor?: string;
    barWidth?: number;
    gap?: number;
    rounded?: number | number[];
    speed?: number;
    isControlPanelShown?: boolean;
    fullscreen?: boolean;
    onlyRecording?: boolean;
    animateCurrentPick?: boolean;
    isDefaultUIShown?: boolean;
  }

  export function useVoiceVisualizer(params?: UseVoiceVisualizerParams): Controls;

  export const VoiceVisualizer: ComponentType<VoiceVisualizerProps>;
}
