"use client";

import type { ReactNode } from "react";
import { Button } from "../ui/button";
import type { FrameDTO } from "../../lib/dto/frame";
import type { PageDTO } from "../../lib/dto/page";
import { pageSizePresetSchema } from "../../lib/dto/page";
import { ShapeProperties } from "../studio/properties/ShapeProperties";
import { resetCropModelV1 } from "../../../../packages/editor/models/cropModel";

export function PropertiesPanel({ // NOSONAR
  page,
  selectedFrame,
  snapEnabled,
  onToggleSnap,
  onPageSizeChange,
  onToggleGrid,
  onPatchFrameDraft,
  onDeleteFrame,
  onBringToFront,
  onSendBackward,
  onOpenImagePicker,
  onStartCropMode,
  onEndCropMode,
  cropModeActive = false
}: {
  page: PageDTO | null;
  selectedFrame: FrameDTO | null;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  onPageSizeChange: (preset: PageDTO["size_preset"]) => Promise<void>;
  onToggleGrid: () => Promise<void>;
  onPatchFrameDraft: (patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h" | "z_index" | "locked">> & {
    style?: Record<string, unknown>;
    content?: Record<string, unknown>;
    crop?: Record<string, unknown> | null;
  }) => void;
  onDeleteFrame: () => Promise<void>;
  onBringToFront: () => void;
  onSendBackward: () => void;
  onOpenImagePicker?: () => void;
  onStartCropMode?: () => void;
  onEndCropMode?: () => void;
  cropModeActive?: boolean;
}) {
  const isTextFrame = selectedFrame?.type === "TEXT";
  const isImageFrame = selectedFrame?.type === "IMAGE";
  const isElementFrame = selectedFrame?.type === "FRAME";
  let selectedFrameContentSection: ReactNode = null;

  if (selectedFrame) {
    if (isTextFrame) {
      selectedFrameContentSection = (
        <div className="mt-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Text Content</p>
          <textarea
            className="min-h-32 w-full rounded-lg border border-white/15 bg-black/25 p-3 text-sm text-white"
            value={typeof selectedFrame.content.text === "string" ? selectedFrame.content.text : ""}
            onChange={(event) =>
              onPatchFrameDraft({
                content: { ...selectedFrame.content, kind: "text_frame_v1", text: event.target.value }
              })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-white/65">
              Font size
              <input
                type="number"
                value={typeof selectedFrame.style.fontSize === "number" ? selectedFrame.style.fontSize : 15}
                onChange={(event) =>
                  onPatchFrameDraft({
                    style: { ...selectedFrame.style, fontSize: Number(event.target.value) }
                  })
                }
                className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-white/65">
              Alignment
              <select
                value={typeof selectedFrame.style.align === "string" ? selectedFrame.style.align : "left"}
                onChange={(event) =>
                  onPatchFrameDraft({
                    style: { ...selectedFrame.style, align: event.target.value }
                  })
                }
                className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        </div>
      );
    } else if (isImageFrame) {
      selectedFrameContentSection = (
        <div className="mt-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Image Placeholder</p>
          {onOpenImagePicker ? (
            <Button type="button" size="sm" variant="secondary" onClick={onOpenImagePicker}>
              Choose Image
            </Button>
          ) : null}
          {onStartCropMode ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={cropModeActive ? "secondary" : "ghost"}
                onClick={cropModeActive ? onEndCropMode : onStartCropMode}
              >
                {cropModeActive ? "Exit Crop" : "Crop Image"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  onPatchFrameDraft({
                    crop: resetCropModelV1(selectedFrame.crop as Record<string, unknown> | null, "free")
                  })
                }
              >
                Reset Crop
              </Button>
            </div>
          ) : null}
          <label className="block text-xs text-white/65">
            Caption
            <input
              type="text"
              value={typeof selectedFrame.content.caption === "string" ? selectedFrame.content.caption : ""}
              onChange={(event) =>
                onPatchFrameDraft({
                  content: { ...selectedFrame.content, kind: "image_frame_v1", caption: event.target.value }
                })
              }
              className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
            />
          </label>
          <div className="rounded-lg border border-white/10 bg-black/15 p-2 text-xs text-white/65">
            Use the Crop panel for zoom, rotate, and crop rectangle adjustments.
          </div>
        </div>
      );
    } else {
      selectedFrameContentSection = (
        <div className="mt-4 space-y-3">
          <ShapeProperties frame={selectedFrame} onPatchFrameDraft={onPatchFrameDraft} />
          {onStartCropMode ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={cropModeActive ? "secondary" : "ghost"}
                onClick={cropModeActive ? onEndCropMode : onStartCropMode}
              >
                {cropModeActive ? "Exit Crop" : "Crop Image"}
              </Button>
            </div>
          ) : null}
          {onOpenImagePicker && isElementFrame ? (
            <Button type="button" size="sm" variant="secondary" onClick={onOpenImagePicker}>
              Fill With Image
            </Button>
          ) : null}
        </div>
      );
    }
  }

  return (
    <aside className="flex h-full w-[320px] flex-col border-l border-white/10 bg-[#0d1626]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Properties</p>
        <p className="mt-1 text-sm text-white/70">
          {selectedFrame ? `${selectedFrame.type} frame selected` : "Select a frame to edit"}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {page ? (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Page</p>
            <div className="mt-3 space-y-3">
              <label className="block text-sm text-white/80">
                Size preset
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-black/25 px-3 text-sm text-white"
                  value={page.size_preset}
                  onChange={(event) => {
                    const parsed = pageSizePresetSchema.safeParse(event.target.value);
                    if (parsed.success) {
                      void onPageSizeChange(parsed.data);
                    }
                  }}
                >
                  <option value="A4">A4</option>
                  <option value="US_LETTER">US Letter</option>
                  <option value="BOOK_6X9">Book 6x9</option>
                  <option value="BOOK_8_5X11">Book 8.5x11</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={page.grid.enabled ? "secondary" : "ghost"} onClick={() => void onToggleGrid()}>
                  {page.grid.enabled ? "Grid On" : "Grid Off"}
                </Button>
                <Button type="button" size="sm" variant={snapEnabled ? "secondary" : "ghost"} onClick={onToggleSnap}>
                  {snapEnabled ? "Snap On" : "Snap Off"}
                </Button>
              </div>
              <p className="text-xs text-white/45">
                {page.width_px} × {page.height_px}px · margins {page.margins.left}/{page.margins.top}
              </p>
            </div>
          </section>
        ) : null}

        {selectedFrame ? (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Frame Geometry</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["x", "y", "w", "h"] as const).map((key) => (
                <label key={key} className="block text-xs text-white/65">
                  {key.toUpperCase()}
                  <input
                    type="number"
                    className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
                    value={Math.round(selectedFrame[key])}
                    onChange={(event) => onPatchFrameDraft({ [key]: Number(event.target.value) } as never)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={onSendBackward}>
                Send Back
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onBringToFront}>
                Bring Front
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedFrame.locked ? "secondary" : "ghost"}
                onClick={() => onPatchFrameDraft({ locked: !selectedFrame.locked })}
              >
                {selectedFrame.locked ? "Unlock" : "Lock"}
              </Button>
            </div>

            {selectedFrameContentSection}

            <div className="mt-4">
              <Button type="button" size="sm" variant="ghost" onClick={() => void onDeleteFrame()}>
                Delete Frame
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/65">
            Select a text or image frame on the canvas to edit geometry and content.
          </section>
        )}
      </div>
    </aside>
  );
}
