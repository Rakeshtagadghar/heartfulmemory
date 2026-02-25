"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";

type AnchorRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function useFloatingAnchor({
  stageRef,
  viewportRef,
  pageSurfaceRef,
  anchorRect,
  offsetY = 10,
  enabled = true,
  mode = "selection"
}: {
  stageRef: RefObject<HTMLElement | null>;
  viewportRef: RefObject<HTMLElement | null>;
  pageSurfaceRef: RefObject<HTMLElement | null>;
  anchorRect: AnchorRect | null;
  offsetY?: number;
  enabled?: boolean;
  mode?: "selection" | "page-top-center";
}) {
  const [position, setPosition] = useState<{ left: number; top: number; visible: boolean }>({
    left: 0,
    top: 0,
    visible: false
  });

  const depsKey = useMemo(
    () =>
      anchorRect ? `${anchorRect.x}:${anchorRect.y}:${anchorRect.w}:${anchorRect.h}:${enabled}` : `none:${enabled}`,
    [anchorRect, enabled]
  );

  useEffect(() => {
    if (!enabled || !anchorRect) return;
    const stageEl = stageRef.current;
    const pageEl = pageSurfaceRef.current;
    const viewportEl = viewportRef.current;
    if (!stageEl || !pageEl || !viewportEl) return;

    let rafId = 0;
    const update = () => {
      const stageRect = stageEl.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();
      const pageLeft = pageRect.left - stageRect.left;
      const pageTop = pageRect.top - stageRect.top;
      const rawLeft =
        mode === "page-top-center"
          ? pageLeft + pageRect.width / 2
          : pageLeft + anchorRect.x + anchorRect.w / 2;
      const rawTop =
        mode === "page-top-center"
          ? pageTop - offsetY
          : pageTop + anchorRect.y - offsetY;
      const clampedLeft = Math.min(Math.max(12, rawLeft), Math.max(12, stageRect.width - 12));
      const clampedTop = Math.max(12, rawTop);

      setPosition((current) => {
        if (current.left === clampedLeft && current.top === clampedTop && current.visible) {
          return current;
        }
        return { left: clampedLeft, top: clampedTop, visible: true };
      });
    };

    const schedule = () => {
      if (rafId) return;
      rafId = globalThis.requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    update();
    viewportEl.addEventListener("scroll", schedule, { passive: true });
    globalThis.addEventListener("resize", schedule);
    return () => {
      viewportEl.removeEventListener("scroll", schedule);
      globalThis.removeEventListener("resize", schedule);
      if (rafId) {
        globalThis.cancelAnimationFrame(rafId);
      }
    };
  }, [anchorRect, depsKey, enabled, mode, offsetY, pageSurfaceRef, stageRef, viewportRef]);

  return position;
}
