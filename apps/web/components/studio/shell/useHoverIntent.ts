"use client";

import { useRef } from "react";

export function useHoverIntent({
  openDelayMs = 150,
  closeDelayMs = 200
}: {
  openDelayMs?: number;
  closeDelayMs?: number;
}) {
  const openTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  function clearOpenTimer() {
    if (!openTimerRef.current) return;
    globalThis.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  }

  function clearCloseTimer() {
    if (!closeTimerRef.current) return;
    globalThis.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function clearAll() {
    clearOpenTimer();
    clearCloseTimer();
  }

  function scheduleOpen(fn: () => void) {
    clearCloseTimer();
    clearOpenTimer();
    openTimerRef.current = globalThis.setTimeout(() => {
      openTimerRef.current = null;
      fn();
    }, openDelayMs);
  }

  function scheduleClose(fn: () => void) {
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = globalThis.setTimeout(() => {
      closeTimerRef.current = null;
      fn();
    }, closeDelayMs);
  }

  return {
    scheduleOpen,
    scheduleClose,
    clearOpenTimer,
    clearCloseTimer,
    clearAll
  };
}
