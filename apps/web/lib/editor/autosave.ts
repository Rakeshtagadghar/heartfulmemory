"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

type SaveResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

type SaveFn<TPayload, TResult> = (payload: TPayload) => Promise<SaveResult<TResult>>;

type UseAutosaveOptions<TPayload, TResult> = {
  payload: TPayload;
  isDirty: boolean;
  debounceMs?: number;
  save: SaveFn<TPayload, TResult>;
  onSaved?: (result: TResult) => void;
  onError?: (result: { error: string; code?: string }) => void;
  onConflict?: (message: string) => void;
};

export function useAutosave<TPayload, TResult>({
  payload,
  isDirty,
  debounceMs = 1000,
  save,
  onSaved,
  onError,
  onConflict
}: UseAutosaveOptions<TPayload, TResult>) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const payloadRef = useRef(payload);
  const dirtyRef = useRef(isDirty);
  const inflightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const runSaveRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    payloadRef.current = payload;
    dirtyRef.current = isDirty;
  }, [payload, isDirty]);

  const runSave = useCallback(async () => {
    if (!dirtyRef.current || inflightRef.current) return;
    inflightRef.current = true;
    setStatus("saving");
    setError(null);

    const result = await save(payloadRef.current);
    inflightRef.current = false;

    if (result.ok) {
      attemptRef.current = 0;
      setStatus("saved");
      onSaved?.(result.data);
      globalThis.setTimeout(() => {
        setStatus((current) => (current === "saved" ? "idle" : current));
      }, 1200);
      return;
    }

    if (result.code === "conflict") {
      setStatus("conflict");
      setError(result.error);
      onConflict?.(result.error);
      return;
    }

    attemptRef.current += 1;
    setStatus("error");
    setError(result.error);
    onError?.({ error: result.error, code: result.code });

    if (attemptRef.current <= 3 && dirtyRef.current) {
      const delay = 400 * 2 ** (attemptRef.current - 1);
      retryTimeoutRef.current = globalThis.setTimeout(() => {
        void runSaveRef.current();
      }, delay);
    }
  }, [onConflict, onError, onSaved, save]);

  useEffect(() => {
    runSaveRef.current = runSave;
  }, [runSave]);

  useEffect(() => {
    if (!isDirty) return;

    if (timerRef.current) globalThis.clearTimeout(timerRef.current);
    timerRef.current = globalThis.setTimeout(() => {
      void runSaveRef.current();
    }, debounceMs);

    return () => {
      if (timerRef.current) globalThis.clearTimeout(timerRef.current);
    };
  }, [debounceMs, isDirty, payload, runSave]);

  useEffect(() => {
    return () => {
      if (timerRef.current) globalThis.clearTimeout(timerRef.current);
      if (retryTimeoutRef.current) globalThis.clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  return {
    status,
    error,
    retryNow: () => void runSaveRef.current()
  };
}

export type AutosaveStatus = SaveStatus;
