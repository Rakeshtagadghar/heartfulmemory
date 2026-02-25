"use client";

import { buildUpdatedShapeStyle } from "../../../../../packages/editor/commands/updateShapeStyle";
import type { FrameDTO } from "../../../lib/dto/frame";

export function ShapeProperties({
  frame,
  onPatchFrameDraft
}: {
  frame: FrameDTO;
  onPatchFrameDraft: (patch: { style?: Record<string, unknown>; content?: Record<string, unknown> }) => void;
}) {
  const isShapeFrame = frame.type === "SHAPE";
  const isElementFrame = frame.type === "FRAME";
  const isLineFrame = frame.type === "LINE";
  const isGroupFrame = frame.type === "GROUP";

  if (!isShapeFrame && !isElementFrame && !isLineFrame && !isGroupFrame) {
    return null;
  }

  const updateStyle = (patch: Record<string, unknown>) => {
    onPatchFrameDraft({
      style: buildUpdatedShapeStyle(frame.style, patch)
    });
  };

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs uppercase tracking-[0.16em] text-white/45">Element Style</p>
      {(isShapeFrame || isElementFrame || isGroupFrame) ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs text-white/65">
            Fill
            <input
              type="text"
              value={typeof frame.style.fill === "string" ? frame.style.fill : ""}
              onChange={(event) => updateStyle({ fill: event.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
              placeholder={isGroupFrame ? "rgba(...)" : "#38bdf8"}
            />
          </label>
          <label className="block text-xs text-white/65">
            Stroke
            <input
              type="text"
              value={typeof frame.style.stroke === "string" ? frame.style.stroke : ""}
              onChange={(event) => updateStyle({ stroke: event.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
              placeholder="#0f172a"
            />
          </label>
          <label className="block text-xs text-white/65">
            Stroke width
            <input
              type="number"
              min={0}
              max={32}
              value={typeof frame.style.strokeWidth === "number" ? frame.style.strokeWidth : 1}
              onChange={(event) => updateStyle({ strokeWidth: Number(event.target.value) })}
              className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
            />
          </label>
          {(isShapeFrame || isElementFrame) ? (
            <label className="block text-xs text-white/65">
              Radius
              <input
                type="number"
                min={0}
                max={240}
                value={
                  typeof frame.style.radius === "number"
                    ? frame.style.radius
                    : typeof frame.style.cornerRadius === "number"
                      ? frame.style.cornerRadius
                      : 0
                }
                onChange={(event) =>
                  updateStyle(
                    isElementFrame ? { cornerRadius: Number(event.target.value) } : { radius: Number(event.target.value) }
                  )
                }
                className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
              />
            </label>
          ) : null}
        </div>
      ) : null}
      {isLineFrame ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs text-white/65">
            Stroke
            <input
              type="text"
              value={typeof frame.style.stroke === "string" ? frame.style.stroke : ""}
              onChange={(event) => updateStyle({ stroke: event.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
              placeholder="#0f172a"
            />
          </label>
          <label className="block text-xs text-white/65">
            Stroke width
            <input
              type="number"
              min={1}
              max={32}
              value={typeof frame.style.strokeWidth === "number" ? frame.style.strokeWidth : 2}
              onChange={(event) => updateStyle({ strokeWidth: Number(event.target.value) })}
              className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
            />
          </label>
        </div>
      ) : null}
      {isGroupFrame ? (
        <p className="text-xs text-white/50">Grid helper group resizes as a single layout block in v1.</p>
      ) : null}
    </div>
  );
}

