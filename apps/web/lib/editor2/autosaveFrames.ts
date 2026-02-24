"use client";

import { useEffect, useRef, useState } from "react";
import type { FrameDTO } from "../dto/frame";

export type FrameSaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

type SaveResult =
  | { ok: true; data: FrameDTO }
  | { ok: false; error: string; code?: string };

export function useFrameAutosave({
  enabled,
  frame,
  draft,
  save,
  onSaved,
  debounceMs = 650
}: {
  enabled: boolean;
  frame: FrameDTO | null;
  draft: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h" | "style" | "content" | "crop" | "z_index">>;
  save: (patch: {
    frameId: string;
    expectedVersion?: number;
  } & Partial<Pick<FrameDTO, "x" | "y" | "w" | "h" | "style" | "content" | "crop" | "z_index">>) => Promise<SaveResult>;
  onSaved: (frame: FrameDTO) => void;
  debounceMs?: number;
}) {
  const [status, setStatus] = useState<FrameSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const signatureRef = useRef<string>("");

  function clearTimers() {
    if (timerRef.current) {
      globalThis.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (resetTimerRef.current) {
      globalThis.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }

  function scheduleSavedReset() {
    if (resetTimerRef.current) {
      globalThis.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = globalThis.setTimeout(() => {
      setStatus((current) => (current === "saved" ? "idle" : current));
      resetTimerRef.current = null;
    }, 900);
  }

  useEffect(() => {
    if (!enabled || !frame) return;
    const patchKeys = Object.keys(draft);
    if (patchKeys.length === 0) return;

    const signature = JSON.stringify({ id: frame.id, v: frame.version, draft });
    if (signature === signatureRef.current) return;
    signatureRef.current = signature;

    clearTimers();
    timerRef.current = globalThis.setTimeout(async () => {
      setStatus("saving");
      setError(null);
      const result = await save({
        frameId: frame.id,
        expectedVersion: frame.version,
        ...draft
      });
      if (!result.ok) {
        setStatus(result.code === "conflict" ? "conflict" : "error");
        setError(result.error);
        return;
      }
      setStatus("saved");
      onSaved(result.data);
      scheduleSavedReset();
    }, debounceMs);

    return () => {
      clearTimers();
    };
  }, [debounceMs, draft, enabled, frame, onSaved, save]);

  return { status, error };
}
