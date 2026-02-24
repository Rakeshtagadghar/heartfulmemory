"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PageDTO } from "../../lib/dto/page";
import type { FrameDTO } from "../../lib/dto/frame";
import { snapFrame } from "../../lib/editor2/snap";
import { GuidesOverlay } from "./GuidesOverlay";
import { FrameRenderer } from "./FrameRenderer";

type InteractionState =
  | null
  | {
      mode: "drag" | "resize";
      frameId: string;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startFrame: Pick<FrameDTO, "x" | "y" | "w" | "h">;
    };

export function CanvasStage({
  page,
  frames,
  selectedFrameId,
  zoom,
  showGrid,
  snapEnabled,
  onSelectFrame,
  onFramePatchPreview,
  onFramePatchCommit
}: {
  page: PageDTO | null;
  frames: FrameDTO[];
  selectedFrameId: string | null;
  zoom: number;
  showGrid: boolean;
  snapEnabled: boolean;
  onSelectFrame: (frameId: string) => void;
  onFramePatchPreview: (
    frameId: string,
    patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h">>
  ) => void;
  onFramePatchCommit: (
    frameId: string,
    patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h">>
  ) => Promise<void>;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [interaction, setInteraction] = useState<InteractionState>(null);

  const frameMap = useMemo(() => new Map(frames.map((frame) => [frame.id, frame])), [frames]);

  useEffect(() => {
    if (!interaction || !page) return;
    const activeInteraction = interaction;
    const activePage = page;

    function onPointerMove(event: PointerEvent) {
      if (event.pointerId !== activeInteraction.pointerId) return;
      const frame = frameMap.get(activeInteraction.frameId);
      if (!frame) return;
      const dx = (event.clientX - activeInteraction.startClientX) / zoom;
      const dy = (event.clientY - activeInteraction.startClientY) / zoom;

      const proposed =
        activeInteraction.mode === "drag"
          ? {
              x: activeInteraction.startFrame.x + dx,
              y: activeInteraction.startFrame.y + dy,
              w: frame.w,
              h: frame.h
            }
          : {
              x: frame.x,
              y: frame.y,
              w: activeInteraction.startFrame.w + dx,
              h: activeInteraction.startFrame.h + dy
            };

      const snapped = snapFrame({
        ...proposed,
        pageWidth: activePage.width_px,
        pageHeight: activePage.height_px,
        snapEnabled,
        gridEnabled: activePage.grid.enabled,
        gridColumns: activePage.grid.columns,
        gridGutter: activePage.grid.gutter,
        margins: activePage.margins
      });

      onFramePatchPreview(activeInteraction.frameId, {
        x: snapped.x,
        y: snapped.y,
        w: snapped.w,
        h: snapped.h
      });
    }

    function onPointerUp(event: PointerEvent) {
      if (event.pointerId !== activeInteraction.pointerId) return;
      const frame = frameMap.get(activeInteraction.frameId);
      setInteraction(null);
      if (!frame) return;
      void onFramePatchCommit(activeInteraction.frameId, {
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h
      });
    }

    globalThis.addEventListener("pointermove", onPointerMove);
    globalThis.addEventListener("pointerup", onPointerUp);
    return () => {
      globalThis.removeEventListener("pointermove", onPointerMove);
      globalThis.removeEventListener("pointerup", onPointerUp);
    };
  }, [frameMap, interaction, onFramePatchCommit, onFramePatchPreview, page, snapEnabled, zoom]);

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/60">
        Create a page to start layout editing.
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#d7d8dc]">
      <div className="flex h-7 items-center border-b border-black/10 bg-[#eef0f3] px-3 text-[11px] text-black/55">
        <div className="grid h-full w-full grid-cols-12">
          {Array.from({ length: 24 }, (_, tick) => tick).map((tick) => (
            <div key={`ruler-${tick}`} className="relative border-r border-black/5 pl-1">
              <span>{tick}</span>
            </div>
          ))}
        </div>
      </div>

      <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-auto">
        <div className="flex min-h-full min-w-full items-start justify-center p-12">
          <div
            className="relative origin-top shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
            style={{
              width: page.width_px * zoom,
              height: page.height_px * zoom
            }}
          >
            <div
              className="absolute inset-0 origin-top-left overflow-hidden rounded-sm border border-black/10"
              style={{
                width: page.width_px,
                height: page.height_px,
                background: page.background.fill,
                transform: `scale(${zoom})`,
                transformOrigin: "top left"
              }}
            >
              <GuidesOverlay page={page} showGrid={showGrid} />
              {frames
                .slice()
                .sort((a, b) => a.z_index - b.z_index)
                .map((frame) => (
                  <FrameRenderer
                    key={frame.id}
                    frame={frame}
                    selected={frame.id === selectedFrameId}
                    onSelect={() => onSelectFrame(frame.id)}
                    onDragStart={(event) => {
                      if (frame.locked) return;
                      event.preventDefault();
                      setInteraction({
                        mode: "drag",
                        frameId: frame.id,
                        pointerId: event.pointerId,
                        startClientX: event.clientX,
                        startClientY: event.clientY,
                        startFrame: { x: frame.x, y: frame.y, w: frame.w, h: frame.h }
                      });
                    }}
                    onResizeStart={(event) => {
                      if (frame.locked) return;
                      event.preventDefault();
                      event.stopPropagation();
                      onSelectFrame(frame.id);
                      setInteraction({
                        mode: "resize",
                        frameId: frame.id,
                        pointerId: event.pointerId,
                        startClientX: event.clientX,
                        startClientY: event.clientY,
                        startFrame: { x: frame.x, y: frame.y, w: frame.w, h: frame.h }
                      });
                    }}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
