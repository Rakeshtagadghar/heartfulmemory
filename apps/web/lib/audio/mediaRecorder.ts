"use client";

export type MediaRecorderErrorCode =
  | "MIC_PERMISSION_DENIED"
  | "MIC_NOT_FOUND"
  | "UNSUPPORTED_BROWSER"
  | "UNSUPPORTED_MIME"
  | "START_FAILED"
  | "STOP_FAILED";

export class MediaRecorderClientError extends Error {
  code: MediaRecorderErrorCode;

  constructor(code: MediaRecorderErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "MediaRecorderClientError";
  }
}

export type BrowserRecordingSession = {
  mimeType: string;
  start(): Promise<void>;
  stop(): Promise<{ blob: Blob; durationMs: number }>;
  cancel(): Promise<void>;
};

export function getSupportedAudioMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4"
  ];

  for (const mimeType of candidates) {
    if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return "";
}

export async function createBrowserRecordingSession(
  options?: {
    preferredMimeType?: string | null;
  }
): Promise<BrowserRecordingSession> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new MediaRecorderClientError("UNSUPPORTED_BROWSER", "This browser does not support voice recording.");
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();
    if (lower.includes("permission") || lower.includes("denied") || lower.includes("notallowed")) {
      throw new MediaRecorderClientError("MIC_PERMISSION_DENIED", "Microphone permission was denied.");
    }
    if (lower.includes("not found") || lower.includes("device") || lower.includes("notfound")) {
      throw new MediaRecorderClientError("MIC_NOT_FOUND", "No microphone was found.");
    }
    throw new MediaRecorderClientError("START_FAILED", `Unable to access microphone: ${message}`);
  }

  const supportedMimeType = options?.preferredMimeType ?? getSupportedAudioMimeType();
  if (supportedMimeType === null) {
    stream.getTracks().forEach((track) => track.stop());
    throw new MediaRecorderClientError("UNSUPPORTED_BROWSER", "Voice recording is not supported here.");
  }

  const mimeType = supportedMimeType || undefined;
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw new MediaRecorderClientError(
      "UNSUPPORTED_MIME",
      error instanceof Error ? error.message : "Unsupported audio recording format."
    );
  }

  const chunks: BlobPart[] = [];
  let startedAt = 0;

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  const stopTracks = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  return {
    mimeType: recorder.mimeType || mimeType || "audio/webm",
    async start() {
      try {
        startedAt = Date.now();
        recorder.start();
      } catch (error) {
        stopTracks();
        throw new MediaRecorderClientError(
          "START_FAILED",
          error instanceof Error ? error.message : "Failed to start recording."
        );
      }
    },
    async stop() {
      if (recorder.state === "inactive") {
        stopTracks();
        throw new MediaRecorderClientError("STOP_FAILED", "Recording is not active.");
      }
      const durationMs = Math.max(0, Date.now() - startedAt);
      const blob = await new Promise<Blob>((resolve, reject) => {
        recorder.addEventListener(
          "stop",
          () => {
            try {
              resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }));
            } catch (error) {
              reject(error);
            }
          },
          { once: true }
        );
        try {
          recorder.stop();
        } catch (error) {
          reject(error);
        }
      }).catch((error) => {
        throw new MediaRecorderClientError(
          "STOP_FAILED",
          error instanceof Error ? error.message : "Failed to stop recording."
        );
      });
      stopTracks();
      return { blob, durationMs };
    },
    async cancel() {
      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch {
        // ignore
      } finally {
        stopTracks();
      }
    }
  };
}

export async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

