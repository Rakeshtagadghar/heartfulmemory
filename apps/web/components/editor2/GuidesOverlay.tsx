"use client";

import type { PageDTO } from "../../lib/dto/page";

export function GuidesOverlay({
  page,
  showGrid,
  showMargins = true,
  showSafeArea = false,
  safeAreaPadding = 0
}: {
  page: Pick<PageDTO, "width_px" | "height_px" | "margins" | "grid">;
  showGrid: boolean;
  showMargins?: boolean;
  showSafeArea?: boolean;
  safeAreaPadding?: number;
}) {
  const { width_px: width, height_px: height, margins, grid } = page;
  const safeWidth = width - margins.left - margins.right;
  const safeHeight = height - margins.top - margins.bottom;
  const printSafe = {
    left: margins.left + safeAreaPadding,
    top: margins.top + safeAreaPadding,
    width: Math.max(1, safeWidth - safeAreaPadding * 2),
    height: Math.max(1, safeHeight - safeAreaPadding * 2)
  };
  const gridColumns = Math.max(1, grid.columns);
  const totalGutters = Math.max(0, gridColumns - 1) * grid.gutter;
  const columnWidth = Math.max(1, (safeWidth - totalGutters) / gridColumns);

  return (
    <div className="pointer-events-none absolute inset-0">
      {showMargins ? (
        <div
          className="absolute border border-amber-500/45"
          style={{
            left: margins.left,
            top: margins.top,
            width: safeWidth,
            height: safeHeight
          }}
        />
      ) : null}
      {showSafeArea ? (
        <div
          className="absolute border border-rose-400/55"
          style={{
            left: printSafe.left,
            top: printSafe.top,
            width: printSafe.width,
            height: printSafe.height
          }}
        />
      ) : null}

      {showGrid && grid.enabled ? (
        <div className="absolute inset-0">
          {Array.from({ length: gridColumns }, (_, index) => {
            const left = margins.left + index * (columnWidth + grid.gutter);
            return (
              <div
                key={`col-${Math.round(left)}-${Math.round(columnWidth)}`}
                className="absolute top-0 h-full bg-cyan-400/8"
                style={{
                  left,
                  width: columnWidth
                }}
              />
            );
          })}
          {Array.from(
            { length: Math.floor(height / Math.max(8, grid.rowHeight)) },
            (_, index) => index * grid.rowHeight
          ).map((top) => (
            <div
              key={`row-${top}`}
              className="absolute left-0 w-full border-t border-white/5"
              style={{ top }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
