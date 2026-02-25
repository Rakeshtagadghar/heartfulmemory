"use client";

import { useRef, useState } from "react";
import { panCropByDelta, normalizeCrop } from "../../lib/editor2/cropModel";

export function CropMode({
  src,
  frameWidth,
  frameHeight,
  crop,
  caption,
  onCropChange,
  onDone
}: {
  src: string;
  frameWidth: number;
  frameHeight: number;
  crop: Record<string, unknown> | null;
  caption?: string | null;
  onCropChange: (cropPatch: { focalX: number; focalY: number; scale: number }) => void;
  onDone: () => void;
}) {
  const [drag, setDrag] = useState<null | { pointerId: number; x: number; y: number }>(null);
  const cropState = normalizeCrop(crop as never);
  const imgWrapRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black/5">
      <div
        ref={imgWrapRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDrag({ pointerId: event.pointerId, x: event.clientX, y: event.clientY });
          (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag || drag.pointerId !== event.pointerId) return;
          const dx = event.clientX - drag.x;
          const dy = event.clientY - drag.y;
          const next = panCropByDelta(cropState, {
            dxPx: dx,
            dyPx: dy,
            frameWidthPx: frameWidth,
            frameHeightPx: frameHeight
          });
          onCropChange(next);
          setDrag({ pointerId: drag.pointerId, x: event.clientX, y: event.clientY });
        }}
        onPointerUp={(event) => {
          if (!drag || drag.pointerId !== event.pointerId) return;
          setDrag(null);
          try {
            (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
          } catch {}
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={caption || "Crop preview"}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: `${Math.round(cropState.focalX * 100)}% ${Math.round(cropState.focalY * 100)}%`,
            transform: `scale(${cropState.scale})`,
            transformOrigin: "center"
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 border-2 border-violet-300/90" />
      <div className="absolute left-2 top-2 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">
        <span className="font-semibold">Crop mode</span>
        <span className="text-white/65">Drag image to set focal point</span>
      </div>
      <button
        type="button"
        className="absolute right-2 top-2 cursor-pointer rounded-lg border border-white/20 bg-black/55 px-2 py-1 text-xs text-white hover:bg-black/70"
        onClick={(event) => {
          event.stopPropagation();
          onDone();
        }}
      >
        Done
      </button>
    </div>
  );
}
