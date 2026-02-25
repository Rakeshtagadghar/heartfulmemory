"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackStudioPanelClose, trackStudioPanelOpen, trackStudioPanelPinToggle } from "../../../lib/analytics/studio";
import { supportsHoverUi } from "./a11y";
import type { StudioShellPanelId } from "./miniSidebarConfig";
import { STUDIO_SHELL_V2_SPEC } from "./spec";
import { useHoverIntent } from "./useHoverIntent";

export type StudioShellInputType = "mouse" | "touch" | "keyboard";

export function useHoverPanelController() {
  const [openPanelId, setOpenPanelId] = useState<StudioShellPanelId | null>(null);
  const [pinnedPanelId, setPinnedPanelId] = useState<StudioShellPanelId | null>(null);
  const [lastInputType, setLastInputType] = useState<StudioShellInputType>("mouse");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedCanvasRef = useRef<HTMLElement | null>(null);
  const hoverCapable = useMemo(() => supportsHoverUi(), []);
  const hoverIntent = useHoverIntent({
    openDelayMs: STUDIO_SHELL_V2_SPEC.hoverIntent.openDelayMs,
    closeDelayMs: STUDIO_SHELL_V2_SPEC.hoverIntent.closeDelayMs
  });

  const closePanel = useCallback(
    (inputType: StudioShellInputType = lastInputType) => {
      hoverIntent.clearAll();
      setPinnedPanelId(null);
      setOpenPanelId((current) => {
        if (current) {
          trackStudioPanelClose(current, { input_type: inputType, pinned: current === pinnedPanelId });
        }
        return null;
      });
      lastFocusedCanvasRef.current?.focus?.();
    },
    [hoverIntent, lastInputType, pinnedPanelId]
  );

  const openPanel = useCallback((panelId: StudioShellPanelId, inputType: StudioShellInputType, pinned = false) => {
    setLastInputType(inputType);
    setOpenPanelId((current) => {
      if (current !== panelId) {
        trackStudioPanelOpen(panelId, { input_type: inputType, pinned });
      }
      return panelId;
    });
    setPinnedPanelId(pinned ? panelId : null);
  }, []);

  const pinPanel = useCallback((panelId: StudioShellPanelId, inputType: StudioShellInputType) => {
    setLastInputType(inputType);
    setPinnedPanelId((current) => {
      const nextPinned = current === panelId ? null : panelId;
      trackStudioPanelPinToggle(panelId, nextPinned === panelId, inputType);
      if (nextPinned === panelId) {
        setOpenPanelId(panelId);
      }
      return nextPinned;
    });
  }, []);

  const onIconHoverStart = useCallback(
    (panelId: StudioShellPanelId) => {
      if (!hoverCapable) return;
      hoverIntent.scheduleOpen(() => openPanel(panelId, "mouse", false));
    },
    [hoverCapable, hoverIntent, openPanel]
  );

  const onIconHoverEnd = useCallback(() => {
    if (!hoverCapable || pinnedPanelId) return;
    hoverIntent.scheduleClose(() => closePanel("mouse"));
  }, [closePanel, hoverCapable, hoverIntent, pinnedPanelId]);

  const onPanelHoverStart = useCallback(() => {
    if (!hoverCapable) return;
    hoverIntent.clearCloseTimer();
  }, [hoverCapable, hoverIntent]);

  const onPanelHoverEnd = useCallback(() => {
    if (!hoverCapable || pinnedPanelId) return;
    hoverIntent.scheduleClose(() => closePanel("mouse"));
  }, [closePanel, hoverCapable, hoverIntent, pinnedPanelId]);

  const onIconActivate = useCallback(
    (panelId: StudioShellPanelId, inputType: StudioShellInputType) => {
      setLastInputType(inputType);
      if (openPanelId === panelId && pinnedPanelId === panelId) {
        trackStudioPanelPinToggle(panelId, false, inputType);
        closePanel(inputType);
        return;
      }
      trackStudioPanelPinToggle(panelId, true, inputType);
      openPanel(panelId, inputType, true);
    },
    [closePanel, openPanel, openPanelId, pinnedPanelId]
  );

  const onCanvasPointerDown = useCallback((target: EventTarget | null) => {
    if (target instanceof HTMLElement) {
      lastFocusedCanvasRef.current = target;
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!openPanelId) return;
      event.preventDefault();
      closePanel("keyboard");
    }

    function onPointerDown(event: PointerEvent) {
      if (pinnedPanelId) return;
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(event.target as Node)) return;
      closePanel("mouse");
    }

    globalThis.addEventListener("keydown", onKeyDown);
    globalThis.addEventListener("pointerdown", onPointerDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
      globalThis.removeEventListener("pointerdown", onPointerDown);
    };
  }, [closePanel, openPanelId, pinnedPanelId]);

  return {
    rootRef,
    hoverCapable,
    openPanelId,
    pinnedPanelId,
    openPanel,
    closePanel,
    pinPanel,
    onIconHoverStart,
    onIconHoverEnd,
    onPanelHoverStart,
    onPanelHoverEnd,
    onIconActivate,
    onCanvasPointerDown
  };
}

export type HoverPanelController = ReturnType<typeof useHoverPanelController>;
