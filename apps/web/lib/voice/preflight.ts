"use client";

import { useEffect, useState } from "react";
import { getVoiceErrorCopy } from "./errors/voiceErrorCopy";
import type { VoiceErrorCode } from "./errors/voiceErrorCodes";

export type VoicePermissionState = PermissionState | "unsupported" | "unknown";

export type VoicePreflightResult = {
  ready: boolean;
  code: VoiceErrorCode | null;
  permissionState: VoicePermissionState;
  hasMicrophone: boolean | null;
  isSecureContext: boolean;
  isSupported: boolean;
  description: string | null;
};

function isLocalhostHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function hasSecureVoiceContext() {
  if (typeof window === "undefined") return false;
  return window.isSecureContext || isLocalhostHost(window.location.hostname);
}

async function queryMicrophonePermission(): Promise<VoicePermissionState> {
  if (typeof navigator === "undefined" || !("permissions" in navigator)) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName
    });
    return status.state;
  } catch {
    return "unsupported";
  }
}

async function detectMicrophonePresence() {
  if (!navigator.mediaDevices?.enumerateDevices) return null;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === "audioinput");
  } catch {
    return null;
  }
}

function buildPreflightResult(
  code: VoiceErrorCode | null,
  permissionState: VoicePermissionState,
  hasMicrophone: boolean | null,
  isSecureContextValue: boolean,
  isSupported: boolean
): VoicePreflightResult {
  return {
    ready: code === null,
    code,
    permissionState,
    hasMicrophone,
    isSecureContext: isSecureContextValue,
    isSupported,
    description: code ? getVoiceErrorCopy(code).description : null
  };
}

export async function checkVoicePreflight(): Promise<VoicePreflightResult> {
  const supported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);
  const secure = hasSecureVoiceContext();

  if (!secure) {
    return buildPreflightResult("MIC_INSECURE_CONTEXT", "unknown", null, secure, supported);
  }

  if (!supported) {
    return buildPreflightResult("MIC_UNSUPPORTED_BROWSER", "unsupported", null, secure, supported);
  }

  const permissionState = await queryMicrophonePermission();
  if (permissionState === "denied") {
    return buildPreflightResult("MIC_PERMISSION_DENIED", permissionState, null, secure, supported);
  }

  const hasMicrophone = await detectMicrophonePresence();
  if (hasMicrophone === false) {
    return buildPreflightResult("MIC_NOT_FOUND", permissionState, hasMicrophone, secure, supported);
  }

  return buildPreflightResult(null, permissionState, hasMicrophone, secure, supported);
}

export function useVoicePreflight(enabled = true) {
  const [result, setResult] = useState<VoicePreflightResult | null>(null);

  useEffect(() => {
    if (!enabled) {
      setResult(null);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const next = await checkVoicePreflight();
      if (!cancelled) setResult(next);
    };

    void refresh();

    const onFocus = () => {
      void refresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onDeviceChange = () => {
      void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      navigator.mediaDevices?.removeEventListener?.("devicechange", onDeviceChange);
    };
  }, [enabled]);

  return result;
}

export function isVoicePreflightBlocking(result: VoicePreflightResult | null) {
  return Boolean(result && !result.ready && result.permissionState !== "prompt");
}
