"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PageDTO } from "../../lib/dto/page";
import type { FrameDTO } from "../../lib/dto/frame";
import { snapFrame } from "../../lib/editor2/snap";
import { GuidesOverlay } from "./GuidesOverlay";
import { FrameRenderer } from "./FrameRenderer";
import type { ResizeHandle } from "./FrameHandles";
import { resizeImageWithAspect } from "../../lib/editor2/resizeImage";
import { normalizeTextNodeStyleV1 } from "../../../../packages/editor/nodes/textNode";
import { FloatingTextToolbar } from "../studio/overlays/FloatingTextToolbar";
import { useFloatingAnchor } from "../studio/overlays/useFloatingAnchor";
import { NodeContextMenu } from "../studio/menus/NodeContextMenu";
import type { NodeMenuActionId } from "../studio/menus/menuActions";
import type { BoundsRect } from "../../../../packages/editor/selection/computeBounds";
import {
  findTopmostFrameDropTarget,
  getDraggedMediaPayload,
  type DraggedMediaPayload
} from "../studio/dnd/frameDropTarget";

type InteractionState =
  | null
  | {
      mode: "drag" | "resize";
      resizeHandle?: ResizeHandle;
      frameId: string;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startFrame: Pick<FrameDTO, "x" | "y" | "w" | "h">;
    };

export function CanvasStage({ // NOSONAR
  page,
  frames,
  selectedFrameId,
  selectedFrameIds = [],
  selectionBounds = null,
  zoom,
  showGrid,
  showMarginsOverlay = true,
  showSafeAreaOverlay = false,
  safeAreaPadding = 0,
  issueHighlightMessagesByFrameId,
  snapEnabled,
  editingTextFrameId,
  cropModeFrameId,
  cropDraftByFrameId,
  onSelectFrame,
  onStartTextEdit,
  onEndTextEdit,
  onTextContentChange,
  onPatchSelectedTextStyle,
  onOpenTextFontPanel,
  onOpenTextColorPanel,
  onDuplicateSelectedTextFrame,
  onDeleteSelectedTextFrame,
  onToggleSelectedFrameLock,
  onNodeMenuAction,
  nodeMenuCanPaste = false,
  nodeMenuCanAlignSelection = false,
  nodeMenuCanDistribute = false,
  onStartCropEdit,
  onEndCropEdit,
  onCropChange,
  onFramePatchPreview,
  onFramePatchCommit,
  onDropMediaOnFrame,
  onClearSelection
}: {
  page: PageDTO | null;
  frames: FrameDTO[];
  selectedFrameId: string | null;
  selectedFrameIds?: string[];
  selectionBounds?: BoundsRect | null;
  zoom: number;
  showGrid: boolean;
  showMarginsOverlay?: boolean;
  showSafeAreaOverlay?: boolean;
  safeAreaPadding?: number;
  issueHighlightMessagesByFrameId?: Record<string, string[]>;
  snapEnabled: boolean;
  editingTextFrameId: string | null;
  cropModeFrameId: string | null;
  cropDraftByFrameId?: Record<string, Record<string, unknown> | null>;
  onSelectFrame: (frameId: string, options?: { additive?: boolean; preserveIfSelected?: boolean }) => void;
  onStartTextEdit: (frameId: string) => void;
  onEndTextEdit: (frameId: string) => void;
  onTextContentChange: (frameId: string, text: string) => void;
  onPatchSelectedTextStyle: (patch: Record<string, unknown>) => void;
  onOpenTextFontPanel?: () => void;
  onOpenTextColorPanel?: () => void;
  onDuplicateSelectedTextFrame: () => void;
  onDeleteSelectedTextFrame: () => void;
  onToggleSelectedFrameLock: () => void;
  onNodeMenuAction?: (action: NodeMenuActionId) => void;
  nodeMenuCanPaste?: boolean;
  nodeMenuCanAlignSelection?: boolean;
  nodeMenuCanDistribute?: boolean;
  onStartCropEdit: (frameId: string) => void;
  onEndCropEdit: (frameId: string) => void;
  onCropChange: (frameId: string, crop: Record<string, unknown>) => void;
  onFramePatchPreview: (
    frameId: string,
    patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h">>
  ) => void;
  onFramePatchCommit: (
    frameId: string,
    patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h">>
  ) => Promise<void>;
  onDropMediaOnFrame?: (frameId: string, payload: DraggedMediaPayload) => void | Promise<void>;
  onClearSelection?: () => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pageSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [interaction, setInteraction] = useState<InteractionState>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<{
    open: boolean;
    left: number;
    top: number;
  }>({ open: false, left: 0, top: 0 });

  const frameMap = useMemo(() => new Map(frames.map((frame) => [frame.id, frame])), [frames]);
  const selectedFrame = useMemo(
    () => (selectedFrameId ? frames.find((frame) => frame.id === selectedFrameId) ?? null : null),
    [frames, selectedFrameId]
  );
  const selectedTextFrame = selectedFrame?.type === "TEXT" ? selectedFrame : null;
  const selectedTextStyle = selectedTextFrame ? normalizeTextNodeStyleV1(selectedTextFrame.style) : null;
  const selectedTextAnchor = selectedTextFrame
    ? {
        x: selectedTextFrame.x * zoom,
        y: selectedTextFrame.y * zoom,
        w: selectedTextFrame.w * zoom,
        h: selectedTextFrame.h * zoom
    }
    : null;
  const floatingTextToolbar = useFloatingAnchor({
    stageRef,
    viewportRef,
    pageSurfaceRef,
    anchorRect: selectedTextAnchor,
    offsetY: 12,
    mode: "page-top-center",
    enabled: Boolean(selectedTextFrame && selectedFrameId !== cropModeFrameId && !interaction)
  });
  const floatingTextQuickActions = useFloatingAnchor({
    stageRef,
    viewportRef,
    pageSurfaceRef,
    anchorRect: selectedTextAnchor,
    offsetY: 12,
    mode: "selection",
    enabled: Boolean(selectedTextFrame && selectedFrameId !== cropModeFrameId && !interaction)
  });
  const toolbarMaxWidthPx = page ? page.width_px * zoom - 20 : undefined;

  useEffect(() => {
    if (!interaction || !page) return;
    const activeInteraction = interaction;
    const activePage = page;
    const minSize = 24;

    function onPointerMove(event: PointerEvent) {// NOSONAR
      if (event.pointerId !== activeInteraction.pointerId) return;
      const frame = frameMap.get(activeInteraction.frameId);
      if (!frame) return;
      const dx = (event.clientX - activeInteraction.startClientX) / zoom;
      const dy = (event.clientY - activeInteraction.startClientY) / zoom;

      let proposed: { x: number; y: number; w: number; h: number };
      if (activeInteraction.mode === "drag") {
        proposed = {
          x: activeInteraction.startFrame.x + dx,
          y: activeInteraction.startFrame.y + dy,
          w: frame.w,
          h: frame.h
        };
      } else {
        const handle = activeInteraction.resizeHandle ?? "se";
        const startX = activeInteraction.startFrame.x;
        const startY = activeInteraction.startFrame.y;
        const startW = activeInteraction.startFrame.w;
        const startH = activeInteraction.startFrame.h;
        let nextX = startX;
        let nextY = startY;
        let nextW = startW;
        let nextH = startH;

        const preserveAspect = frame.type === "IMAGE" && !event.shiftKey;
        if (preserveAspect) {
          proposed = resizeImageWithAspect({
            start: { x: startX, y: startY, w: startW, h: startH },
            dx,
            dy,
            handle,
            minSize
          });
        } else {
          if (handle.includes("e")) {
            nextW = Math.max(minSize, startW + dx);
          }
          if (handle.includes("s")) {
            nextH = Math.max(minSize, startH + dy);
          }
          if (handle.includes("w")) {
            const rawW = startW - dx;
            nextW = Math.max(minSize, rawW);
            nextX = startX + (startW - nextW);
          }
          if (handle.includes("n")) {
            const rawH = startH - dy;
            nextH = Math.max(minSize, rawH);
            nextY = startY + (startH - nextH);
          }

          proposed = { x: nextX, y: nextY, w: nextW, h: nextH };
        }
      }

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

  const nodeContextMenuOpen =
    nodeContextMenu.open &&
    Boolean(selectedFrame) &&
    editingTextFrameId !== selectedFrame?.id &&
    Boolean(onNodeMenuAction);

  return (
    <div ref={stageRef} className="relative flex h-full min-h-0 flex-col bg-[#d7d8dc]">
      <button
        type="button"
        className="flex h-7 items-center border-b border-black/10 bg-[#eef0f3] px-3 text-[11px] text-black/55"
        onPointerDown={() => onClearSelection?.()}
        aria-label="Canvas ruler"
      >
        <div className="grid h-full w-full grid-cols-12">
          {Array.from({ length: 24 }, (_, tick) => tick).map((tick) => (
            <div key={`ruler-${tick}`} className="relative border-r border-black/5 pl-1">
              <span>{tick}</span>
            </div>
          ))}
        </div>
      </button>

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-auto"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onClearSelection?.();
          }
        }}
      >
        <div className="flex min-h-full min-w-full items-start justify-center p-12">
          <div
            ref={pageSurfaceRef}
            className="relative origin-top shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
            style={{
              width: page.width_px * zoom,
              height: page.height_px * zoom
            }}
          >
            <div // NOSONAR drag/drop canvas surface wrapper
              className="absolute inset-0 origin-top-left overflow-hidden rounded-sm border border-black/10"
              role="button"
              tabIndex={0}
              aria-label="Layout canvas drop surface"
              style={{
                width: page.width_px,
                height: page.height_px,
                background: page.background.fill,
                transform: `scale(${zoom})`,
                transformOrigin: "top left"
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  onClearSelection?.();
                }
              }}
              onDragOver={(event) => {
                const payload = getDraggedMediaPayload(event.dataTransfer);
                if (!payload) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const point = {
                  x: (event.clientX - rect.left) / zoom,
                  y: (event.clientY - rect.top) / zoom
                };
                const targetFrame = findTopmostFrameDropTarget(frames, point);
                if (!targetFrame) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(event) => {
                const payload = getDraggedMediaPayload(event.dataTransfer);
                if (!payload || !onDropMediaOnFrame) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const point = {
                  x: (event.clientX - rect.left) / zoom,
                  y: (event.clientY - rect.top) / zoom
                };
                const targetFrame = findTopmostFrameDropTarget(frames, point);
                if (!targetFrame) return;
                event.preventDefault();
                Promise.resolve(onDropMediaOnFrame(targetFrame.id, payload)).catch(() => undefined);
              }}
            >
              <button
                type="button"
                aria-label="Page canvas background"
                className="absolute inset-0 z-0 cursor-default"
                onPointerDown={() => onClearSelection?.()}
              />
              <GuidesOverlay
                page={page}
                showGrid={showGrid}
                showMargins={showMarginsOverlay}
                showSafeArea={showSafeAreaOverlay}
                safeAreaPadding={safeAreaPadding}
              />
              {frames
                .slice()
                .sort((a, b) => a.z_index - b.z_index)
                .map((frame) => (
                  <FrameRenderer
                    key={frame.id}
                    frame={frame}
                    selected={selectedFrameIds.includes(frame.id)}
                    textEditing={frame.id === editingTextFrameId}
                    cropEditing={frame.id === cropModeFrameId}
                    cropOverride={cropDraftByFrameId?.[frame.id] ?? null}
                    onSelect={(options) => onSelectFrame(frame.id, options)}
                    onStartTextEdit={() => onStartTextEdit(frame.id)}
                    onEndTextEdit={() => onEndTextEdit(frame.id)}
                    onTextChange={(value) => onTextContentChange(frame.id, value)}
                    onOpenTextContextMenu={(clientX, clientY) => {
                      const stageRect = stageRef.current?.getBoundingClientRect();
                      if (!stageRect) return;
                      setNodeContextMenu({
                        open: true,
                        left: clientX - stageRect.left + 6,
                        top: clientY - stageRect.top + 6
                      });
                    }}
                    onOpenElementContextMenu={(clientX, clientY) => {
                      const stageRect = stageRef.current?.getBoundingClientRect();
                      if (!stageRect) return;
                      setNodeContextMenu({
                        open: true,
                        left: clientX - stageRect.left + 6,
                        top: clientY - stageRect.top + 6
                      });
                    }}
                    onStartCropEdit={() => onStartCropEdit(frame.id)}
                    onEndCropEdit={() => onEndCropEdit(frame.id)}
                    onCropChange={(crop) => onCropChange(frame.id, crop)}
                    issueMessages={issueHighlightMessagesByFrameId?.[frame.id]}
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
                    onResizeStart={(handle, event) => {
                      if (frame.locked) return;
                      event.preventDefault();
                      event.stopPropagation();
                      onSelectFrame(frame.id, { preserveIfSelected: true });
                      setInteraction({
                        mode: "resize",
                        resizeHandle: handle,
                        frameId: frame.id,
                        pointerId: event.pointerId,
                        startClientX: event.clientX,
                        startClientY: event.clientY,
                        startFrame: { x: frame.x, y: frame.y, w: frame.w, h: frame.h }
                      });
                    }}
                  />
                ))}
              {selectionBounds && selectedFrameIds.length > 1 ? (
                <div
                  className="pointer-events-none absolute z-30 rounded-md border border-cyan-300/80 ring-1 ring-cyan-300/30"
                  style={{
                    left: selectionBounds.x,
                    top: selectionBounds.y,
                    width: selectionBounds.w,
                    height: selectionBounds.h
                  }}
                >
                  <div className="absolute -top-6 left-0 rounded bg-cyan-400/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#052a33]">
                    {selectedFrameIds.length} selected
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {selectedTextFrame && selectedTextStyle ? (
        <FloatingTextToolbar
          open={Boolean(selectedTextFrame && !interaction)}
          position={floatingTextToolbar}
          selectionPosition={floatingTextQuickActions}
          maxWidthPx={toolbarMaxWidthPx}
          style={selectedTextStyle}
          onPatchStyle={onPatchSelectedTextStyle}
          onOpenFontPanel={onOpenTextFontPanel}
          onOpenColorPanel={onOpenTextColorPanel}
          onDuplicate={onDuplicateSelectedTextFrame}
          onDelete={onDeleteSelectedTextFrame}
          onToggleLock={onToggleSelectedFrameLock}
          locked={Boolean(selectedTextFrame.locked)}
        />
      ) : null}
      {selectedFrame ? (
        <NodeContextMenu
          key={`${selectedFrame.id}:${selectedFrameIds.length}:${nodeContextMenu.open ? "open" : "closed"}`}
          open={nodeContextMenuOpen}
          x={nodeContextMenu.left}
          y={nodeContextMenu.top}
          onClose={() => setNodeContextMenu((current) => ({ ...current, open: false }))}
          onAction={(action) => onNodeMenuAction?.(action)}
          locked={selectedFrameIds.length > 1 ? selectedFrameIds.every((id) => frameMap.get(id)?.locked) : Boolean(selectedFrame.locked)}
          canPaste={nodeMenuCanPaste}
          canReplaceImage={selectedFrameIds.length === 1 && selectedFrame.type === "FRAME"}
          isMulti={selectedFrameIds.length > 1}
          canAlignSelection={nodeMenuCanAlignSelection}
          canDistribute={nodeMenuCanDistribute}
        />
      ) : null}
    </div>
  );
}
