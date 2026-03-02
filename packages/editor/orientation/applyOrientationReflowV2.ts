import type { OrientationType, PageWithFrames, FrameClampPatch, OrientationPatch } from "./applyOrientation";
import { computeSafeBox, toRelativeRect, fromRelativeRect, clampRectToBox, classifyNode } from "../../shared/orientation/reflowMath";

/**
 * V2 orientation reflow engine.
 *
 * Wide nodes (>= 60% of safe area width) preserve their relative width
 * and position as a percentage of the safe area.
 *
 * Fixed nodes keep their absolute size but map x/y proportionally,
 * then clamp to stay inside the safe area.
 */
export function applyOrientationReflowV2(
  pages: PageWithFrames[],
  newOrientation: OrientationType
): OrientationPatch[] {
  return pages.map((page) => {
    const currentIsLandscape = page.widthPx > page.heightPx;
    const newIsLandscape = newOrientation === "landscape";

    let newWidth: number;
    let newHeight: number;
    if (currentIsLandscape === newIsLandscape) {
      newWidth = page.widthPx;
      newHeight = page.heightPx;
    } else {
      newWidth = page.heightPx;
      newHeight = page.widthPx;
    }

    const safeBoxOld = computeSafeBox(page.widthPx, page.heightPx, page.margins);
    const safeBoxNew = computeSafeBox(newWidth, newHeight, page.margins);

    const framePatch: FrameClampPatch[] = page.frames.map((frame) => {
      const classification = classifyNode(frame.w, safeBoxOld.w);

      if (classification === "wide") {
        // Preserve relative width and position
        const rel = toRelativeRect(
          { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
          safeBoxOld
        );
        const mapped = fromRelativeRect(rel, safeBoxNew);
        const clamped = clampRectToBox(mapped, safeBoxNew);
        return { frameId: frame.id, ...clamped };
      }

      // Fixed node: keep absolute w/h, map x/y proportionally
      const relPos = toRelativeRect(
        { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
        safeBoxOld
      );
      const mappedX = Math.round(safeBoxNew.x + relPos.rx * safeBoxNew.w);
      const mappedY = Math.round(safeBoxNew.y + relPos.ry * safeBoxNew.h);
      const clamped = clampRectToBox(
        { x: mappedX, y: mappedY, w: frame.w, h: frame.h },
        safeBoxNew
      );
      return { frameId: frame.id, ...clamped };
    });

    return { pageId: page.id, widthPx: newWidth, heightPx: newHeight, framePatch };
  });
}
