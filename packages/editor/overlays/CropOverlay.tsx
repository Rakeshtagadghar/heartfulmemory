"use client";

import { useMemo, useState } from "react";
import { normalizeCropModelV1 } from "../models/cropModel";
import { resizeCropRectByHandle, type CropHandle } from "../interaction/cropDragHandles";

type HandleDragState = {
  pointerId: number;
  handle: CropHandle;
  x: number;
  y: number;
};

const HANDLE_POSITIONS: Array<{ handle: CropHandle; className: string; cursor: string }> = [
  { handle: "nw", className: "-left-2 -top-2", cursor: "nwse-resize" },
  { handle: "n", className: "left-1/2 -top-2 -translate-x-1/2", cursor: "ns-resize" },
  { handle: "ne", className: "-right-2 -top-2", cursor: "nesw-resize" },
  { handle: "e", className: "-right-2 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { handle: "se", className: "-right-2 -bottom-2", cursor: "nwse-resize" },
  { handle: "s", className: "left-1/2 -bottom-2 -translate-x-1/2", cursor: "ns-resize" },
  { handle: "sw", className: "-left-2 -bottom-2", cursor: "nesw-resize" },
  { handle: "w", className: "-left-2 top-1/2 -translate-y-1/2", cursor: "ew-resize" }
];

export function CropOverlay({
  crop,
  frameWidth,
  frameHeight,
  disabled = false,
  onCropChange
}: {
  crop: Record<string, unknown> | null | undefined;
  frameWidth: number;
  frameHeight: number;
  disabled?: boolean;
  onCropChange: (nextCrop: Record<string, unknown>) => void;
}) {
  const [drag, setDrag] = useState<HandleDragState | null>(null);
  const normalized = normalizeCropModelV1(crop ?? undefined);
  const rect = normalized.rectNorm;

  const rectPx = useMemo(() => ({
    left: rect.x * frameWidth,
    top: rect.y * frameHeight,
    width: rect.w * frameWidth,
    height: rect.h * frameHeight
  }), [frameHeight, frameWidth, rect.h, rect.w, rect.x, rect.y]);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 bg-black/15" style={{ height: rectPx.top }} />
      <div
        className="absolute inset-x-0 bg-black/15"
        style={{ top: rectPx.top + rectPx.height, height: Math.max(0, frameHeight - (rectPx.top + rectPx.height)) }}
      />
      <div className="absolute left-0 bg-black/15" style={{ top: rectPx.top, width: rectPx.left, height: rectPx.height }} />
      <div
        className="absolute right-0 bg-black/15"
        style={{
          top: rectPx.top,
          width: Math.max(0, frameWidth - (rectPx.left + rectPx.width)),
          height: rectPx.height
        }}
      />
      <div
        className="pointer-events-none absolute border-2 border-violet-300 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]"
        style={rectPx}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          <div className="border border-white/20" />
          <div className="border border-white/20" />
          <div className="border border-white/20" />
          <div className="border border-white/20" />
          <div className="border border-white/20" />
          <div className="border border-white/20" />
          <div className="border border-white/20" />
          <div className="border border-white/20" />
          <div className="border border-white/20" />
        </div>
        {HANDLE_POSITIONS.map(({ handle, className, cursor }) => (
          <button
            key={handle}
            type="button"
            aria-label={`Resize crop ${handle}`}
            disabled={disabled}
            className={`absolute ${className} h-4 w-4 cursor-pointer rounded-full border border-white/80 bg-violet-400 shadow`}
            style={{ cursor }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDrag({
                pointerId: event.pointerId,
                handle,
                x: event.clientX,
                y: event.clientY
              });
              (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!drag || drag.pointerId !== event.pointerId || drag.handle !== handle) return;
              const next = resizeCropRectByHandle(normalized, {
                handle,
                dxPx: event.clientX - drag.x,
                dyPx: event.clientY - drag.y,
                frameWidthPx: frameWidth,
                frameHeightPx: frameHeight
              });
              onCropChange(next);
              setDrag({
                ...drag,
                x: event.clientX,
                y: event.clientY
              });
            }}
            onPointerUp={(event) => {
              if (!drag || drag.pointerId !== event.pointerId) return;
              setDrag(null);
              try {
                (event.currentTarget as HTMLButtonElement).releasePointerCapture(event.pointerId);
              } catch {}
            }}
          />
        ))}
      </div>
    </div>
  );
}
