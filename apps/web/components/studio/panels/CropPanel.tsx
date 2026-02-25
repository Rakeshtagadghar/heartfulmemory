"use client";

import { Button } from "../../ui/button";
import { normalizeCropModelV1, type CropModelV1 } from "../../../../../packages/editor/models/cropModel";

export function CropPanel({
  frameType,
  crop,
  disabled = false,
  onZoomChange,
  onRotateStep,
  onReset,
  onApply,
  onCancel
}: {
  frameType: "IMAGE" | "FRAME";
  crop: Record<string, unknown> | CropModelV1 | null;
  disabled?: boolean;
  onZoomChange: (zoom: number) => void;
  onRotateStep: (deltaDeg: number) => void;
  onReset: () => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const normalized = normalizeCropModelV1(crop as Record<string, unknown> | null | undefined, {
    mode: frameType === "FRAME" ? "frame" : "free",
    objectFit: frameType === "FRAME" ? "cover" : "contain"
  });

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Crop</p>
        <p className="mt-2 text-sm text-white/90">
          {frameType === "FRAME" ? "Editing frame fill image crop" : "Editing image crop"}
        </p>
        <p className="mt-1 text-xs text-white/55">
          Drag on the canvas to pan the image. Use zoom and rotate controls below.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="crop-zoom" className="text-xs uppercase tracking-[0.14em] text-white/45">
              Zoom
            </label>
            <span className="text-xs text-white/70">{normalized.zoom.toFixed(2)}x</span>
          </div>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={5}
            step={0.05}
            value={normalized.zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
            className="w-full cursor-pointer"
            disabled={disabled}
          />
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Rotate</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onRotateStep(-90)}
            >
              Rotate -90°
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onRotateStep(90)}
            >
              Rotate +90°
            </Button>
            <span className="text-xs text-white/70">
              {Math.round(normalized.rotationDeg)}°
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/15 p-2 text-xs text-white/65">
          <p>Mode: {normalized.mode}</p>
          <p>Fit: {normalized.objectFit}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={onReset}>
          Reset Crop
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={disabled} onClick={onApply}>
          Done
        </Button>
      </div>
    </div>
  );
}

