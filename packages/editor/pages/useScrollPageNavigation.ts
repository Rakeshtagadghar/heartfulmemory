"use client";

import { useCallback, useMemo, useRef } from "react";
import type { WheelEvent } from "react";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  if (tag === "textarea") return true;
  if (tag !== "input") return false;
  const input = target as HTMLInputElement;
  return input.type !== "range" && input.type !== "button" && input.type !== "checkbox";
}

export function useScrollPageNavigation(input: {
  enabled: boolean;
  onNext: () => void;
  onPrevious: () => void;
  threshold?: number;
  cooldownMs?: number;
}) {
  const deltaAccumulator = useRef(0);
  const lockedUntilRef = useRef(0);
  const threshold = input.threshold ?? 70;
  const cooldownMs = input.cooldownMs ?? 260;

  const onWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    if (!input.enabled) return;
    if (isEditableTarget(event.target)) return;
    const now = Date.now();
    if (now < lockedUntilRef.current) {
      event.preventDefault();
      return;
    }

    deltaAccumulator.current += event.deltaY;
    if (Math.abs(deltaAccumulator.current) < threshold) return;

    event.preventDefault();
    if (deltaAccumulator.current > 0) {
      input.onNext();
    } else {
      input.onPrevious();
    }
    deltaAccumulator.current = 0;
    lockedUntilRef.current = now + cooldownMs;
  }, [cooldownMs, input, threshold]);

  const handlers = useMemo(() => ({ onWheel }), [onWheel]);
  return handlers;
}
