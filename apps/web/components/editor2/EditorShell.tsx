"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { StorybookDTO } from "../../lib/dto/storybook";
import type { PageDTO } from "../../lib/dto/page";
import type { FrameDTO } from "../../lib/dto/frame";
import {
  createFrameAction,
  createPageAction,
  ensureLayoutCanvasAction,
  removeFrameAction,
  reorderPagesAction,
  updateFrameAction,
  updateLayoutStorybookSettingsAction,
  updatePageSettingsAction
} from "../../lib/actions/editor2";
import { useFrameAutosave } from "../../lib/editor2/autosaveFrames";
import { eldersFirstPageTemplates } from "../../content/pageTemplates/elders-first";
import { PagesPanel } from "./PagesPanel";
import { CanvasStage } from "./CanvasStage";
import { PropertiesPanel } from "./PropertiesPanel";
import { Editor2SaveStatus } from "./SaveStatus";
import { TemplatePicker } from "./TemplatePicker";
import { ExportButton } from "./ExportButton";
import { Button } from "../ui/button";

function sortPages(pages: PageDTO[]) {
  return [...pages].sort((a, b) => a.order_index - b.order_index);
}

function sortFrames(frames: FrameDTO[]) {
  return [...frames].sort((a, b) => a.z_index - b.z_index);
}

function mergeFrameIntoMap(
  current: Record<string, FrameDTO[]>,
  updated: FrameDTO
): Record<string, FrameDTO[]> {
  const next = { ...current };
  const frames = [...(next[updated.page_id] ?? [])];
  const index = frames.findIndex((item) => item.id === updated.id);
  if (index >= 0) {
    frames[index] = updated;
  } else {
    frames.push(updated);
  }
  next[updated.page_id] = sortFrames(frames);
  return next;
}

export function Editor2Shell({
  storybook,
  initialPages,
  initialFramesByPageId,
  fullscreen = false
}: {
  storybook: StorybookDTO;
  initialPages: PageDTO[];
  initialFramesByPageId: Record<string, FrameDTO[]>;
  fullscreen?: boolean;
}) {
  const [pages, setPages] = useState(sortPages(initialPages));
  const [framesByPageId, setFramesByPageId] =
    useState<Record<string, FrameDTO[]>>(initialFramesByPageId);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialPages[0]?.id ?? null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFrameDraftPatch, setSelectedFrameDraftPatch] = useState<
    Partial<Pick<FrameDTO, "x" | "y" | "w" | "h" | "z_index" | "locked">> & {
      style?: Record<string, unknown>;
      content?: Record<string, unknown>;
      crop?: Record<string, unknown> | null;
    }
  >({});
  const [isPending, startTransition] = useTransition();
  const effectiveSelectedPageId = selectedPageId ?? pages[0]?.id ?? null;

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === effectiveSelectedPageId) ?? null,
    [effectiveSelectedPageId, pages]
  );
  const currentFrames = useMemo(
    () => (effectiveSelectedPageId ? sortFrames(framesByPageId[effectiveSelectedPageId] ?? []) : []),
    [effectiveSelectedPageId, framesByPageId]
  );
  const selectedFrame = useMemo(
    () => currentFrames.find((frame) => frame.id === selectedFrameId) ?? null,
    [currentFrames, selectedFrameId]
  );

  async function persistFramePatch(frameId: string, patch: Parameters<typeof updateFrameAction>[2]) {
    const result = await updateFrameAction(storybook.id, frameId, patch);
    if (!result.ok) {
      setMessage(result.error);
      return result;
    }
    setFramesByPageId((current) => mergeFrameIntoMap(current, result.data));
    setMessage(null);
    if (selectedFrameId === frameId) {
      setSelectedFrameDraftPatch({});
    }
    return result;
  }

  const autosave = useFrameAutosave({
    enabled: Boolean(selectedFrame) && Object.keys(selectedFrameDraftPatch).length > 0,
    frame: selectedFrame,
    draft: selectedFrameDraftPatch,
    save: async (patch) => persistFramePatch(patch.frameId, patch),
    onSaved: (frame) => {
      setFramesByPageId((current) => mergeFrameIntoMap(current, frame));
      setSelectedFrameDraftPatch({});
    }
  });

  async function ensureCanvas() {
    const result = await ensureLayoutCanvasAction(storybook.id);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setPages(sortPages(result.data));
    if (!selectedPageId && result.data[0]) {
      setSelectedPageId(result.data[0].id);
    }
  }

  async function handleAddPage() {
    const result = await createPageAction(storybook.id, selectedPage?.size_preset ?? "BOOK_8_5X11");
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setPages((current) => sortPages([...current, result.data]));
    setSelectedPageId(result.data.id);
    setFramesByPageId((current) => ({ ...current, [result.data.id]: [] }));
    setMessage(null);
  }

  async function handleMovePage(pageId: string, direction: -1 | 1) {
    const index = pages.findIndex((page) => page.id === pageId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= pages.length) return;
    const next = [...pages];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    const optimistic = next.map((page, idx) => ({ ...page, order_index: idx }));
    const previous = pages;
    setPages(optimistic);
    const result = await reorderPagesAction(storybook.id, optimistic.map((page) => page.id));
    if (!result.ok) {
      setPages(previous);
      setMessage(result.error);
      return;
    }
    setMessage(null);
  }

  async function handleAddFrame(type: FrameDTO["type"]) {
    if (!selectedPage) return;
    const result = await createFrameAction(storybook.id, selectedPage.id, { type });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setFramesByPageId((current) => mergeFrameIntoMap(current, result.data));
    setSelectedFrameId(result.data.id);
    setMessage(null);
  }

  async function handleApplyTemplate(templateId: string) {
    if (!selectedPage) return;
    const template = eldersFirstPageTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setMessage(null);
    for (const blueprint of template.frames) {
      const result = await createFrameAction(storybook.id, selectedPage.id, {
        type: blueprint.type,
        x: blueprint.x,
        y: blueprint.y,
        w: blueprint.w,
        h: blueprint.h,
        locked: blueprint.locked ?? false,
        style: blueprint.style,
        content: blueprint.content
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setFramesByPageId((current) => mergeFrameIntoMap(current, result.data));
    }
  }

  function applySelectedFrameDraftPatch(
    patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h" | "z_index" | "locked">> & {
      style?: Record<string, unknown>;
      content?: Record<string, unknown>;
      crop?: Record<string, unknown> | null;
    }
  ) {
    if (!selectedFrame) return;
    setFramesByPageId((current) => {
      const next = { ...current };
      const pageFrames = [...(next[selectedFrame.page_id] ?? [])];
      const index = pageFrames.findIndex((item) => item.id === selectedFrame.id);
      if (index >= 0) {
        pageFrames[index] = { ...pageFrames[index], ...patch };
        next[selectedFrame.page_id] = sortFrames(pageFrames);
      }
      return next;
    });
    setSelectedFrameDraftPatch((current) => ({ ...current, ...patch }));
  }

  async function handleCommitFramePatch(frameId: string, patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h">>) {
    const frame = currentFrames.find((item) => item.id === frameId);
    if (!frame) return;
    await persistFramePatch(frameId, {
      ...patch,
      expectedVersion: frame.version
    });
  }

  async function handleDeleteSelectedFrame() {
    if (!selectedFrameId || !selectedPageId) return;
    const result = await removeFrameAction(storybook.id, selectedFrameId);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setFramesByPageId((current) => {
      const next = { ...current };
      next[selectedPageId] = (next[selectedPageId] ?? []).filter((frame) => frame.id !== selectedFrameId);
      return next;
    });
    setSelectedFrameId(null);
    setSelectedFrameDraftPatch({});
  }

  async function handlePageSizeChange(preset: PageDTO["size_preset"]) {
    if (!selectedPage) return;
    const result = await updatePageSettingsAction(storybook.id, selectedPage.id, { size_preset: preset });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setPages((current) => current.map((page) => (page.id === selectedPage.id ? result.data : page)));
    await updateLayoutStorybookSettingsAction(storybook.id, {
      pageSize: preset,
      margins: result.data.margins,
      grid: result.data.grid
    });
  }

  async function handleToggleGrid() {
    if (!selectedPage) return;
    const result = await updatePageSettingsAction(storybook.id, selectedPage.id, {
      grid: { ...selectedPage.grid, enabled: !selectedPage.grid.enabled, showGuides: !selectedPage.grid.enabled }
    });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setPages((current) => current.map((page) => (page.id === selectedPage.id ? result.data : page)));
  }

  function handleBringToFront() {
    if (!selectedFrame || !selectedPageId) return;
    const maxZ = Math.max(0, ...currentFrames.map((frame) => frame.z_index));
    applySelectedFrameDraftPatch({ z_index: maxZ + 1 });
  }

  function handleSendBackward() {
    if (!selectedFrame) return;
    applySelectedFrameDraftPatch({ z_index: Math.max(1, selectedFrame.z_index - 1) });
  }

  function handleSelectPage(pageId: string) {
    setSelectedPageId(pageId);
    setSelectedFrameId(null);
    setSelectedFrameDraftPatch({});
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        !selectedFrame ||
        (event.target instanceof HTMLElement &&
          ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))
      ) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        startTransition(() => {
          void handleDeleteSelectedFrame();
        });
        return;
      }

      const nudge = event.shiftKey ? 10 : 1;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const patch =
          event.key === "ArrowUp"
            ? { y: selectedFrame.y - nudge }
            : event.key === "ArrowDown"
              ? { y: selectedFrame.y + nudge }
              : event.key === "ArrowLeft"
                ? { x: selectedFrame.x - nudge }
                : { x: selectedFrame.x + nudge };
        applySelectedFrameDraftPatch(patch);
      }
    }

    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [applySelectedFrameDraftPatch, handleDeleteSelectedFrame, selectedFrame, startTransition]);

  return (
    <div
      className={
        fullscreen
          ? "flex h-screen min-h-screen flex-col overflow-hidden bg-[#0a111d]"
          : "flex h-[calc(100vh-5.5rem)] min-h-[680px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a111d] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      }
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[linear-gradient(90deg,#12b7c3_0%,#2f8be6_52%,#5b42de_100%)] px-4 py-2 text-white">
        <div className="flex items-center gap-2">
          <Link href={`/app/storybooks/${storybook.id}`} className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/20">
            Back
          </Link>
          <span className="text-sm font-semibold">Memorioso Layout Studio</span>
          <span className="rounded-full bg-white/15 px-2 py-1 text-[11px] uppercase tracking-[0.14em]">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TemplatePicker onApplyTemplate={handleApplyTemplate} />
          <Editor2SaveStatus status={autosave.status} error={autosave.error} />
          <ExportButton storybookId={storybook.id} />
          <Button type="button" size="sm" variant="secondary" onClick={() => void handleAddFrame("TEXT")}>
            Add Text
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => void handleAddFrame("IMAGE")}>
            Add Image
          </Button>
          <Button type="button" size="sm" onClick={() => void ensureCanvas()}>
            Ensure Canvas
          </Button>
        </div>
      </div>

      {message ? (
        <div className="border-b border-rose-300/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{message}</div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="flex w-12 flex-col items-center gap-2 border-r border-white/10 bg-[#0b1320] py-3">
          {["T", "Img", "Pg", "Grid"].map((label) => (
            <button
              key={label}
              type="button"
              className="h-9 w-9 cursor-pointer rounded-lg border border-white/10 bg-white/[0.02] text-[11px] font-semibold text-white/80 hover:bg-white/[0.06]"
            >
              {label}
            </button>
          ))}
        </div>

        <PagesPanel
          pages={pages}
          selectedPageId={effectiveSelectedPageId}
          framesByPageId={framesByPageId}
          onSelectPage={handleSelectPage}
          onAddPage={handleAddPage}
          onMovePage={handleMovePage}
        />

        <div className="relative min-w-0 flex-1">
          <CanvasStage
            page={selectedPage}
            frames={currentFrames}
            selectedFrameId={selectedFrameId}
            zoom={zoom}
            showGrid={showGridOverlay}
            snapEnabled={snapEnabled}
            onSelectFrame={setSelectedFrameId}
            onFramePatchPreview={(frameId, patch) => {
              const active = currentFrames.find((frame) => frame.id === frameId);
              if (!active) return;
              setFramesByPageId((current) => {
                const next = { ...current };
                next[active.page_id] = (next[active.page_id] ?? []).map((frame) =>
                  frame.id === frameId ? { ...frame, ...patch } : frame
                );
                return next;
              });
            }}
            onFramePatchCommit={handleCommitFramePatch}
          />

          <div className="pointer-events-none absolute inset-0">
            <div className="pointer-events-auto absolute bottom-4 right-4 rounded-xl border border-white/15 bg-[#0c1422]/90 p-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-8 w-8 cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] text-white"
                  onClick={() => setZoom((value) => Math.max(0.45, Number((value - 0.05).toFixed(2))))}
                >
                  -
                </button>
                <span className="min-w-14 text-center text-xs font-semibold text-white/90">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  className="h-8 w-8 cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] text-white"
                  onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.05).toFixed(2))))}
                >
                  +
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={showGridOverlay ? "secondary" : "ghost"} onClick={() => setShowGridOverlay((value) => !value)}>
                  Overlay Grid
                </Button>
                <Button type="button" size="sm" variant={snapEnabled ? "secondary" : "ghost"} onClick={() => setSnapEnabled((value) => !value)}>
                  Snap
                </Button>
              </div>
            </div>
          </div>
        </div>

        <PropertiesPanel
          page={selectedPage}
          selectedFrame={selectedFrame}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled((value) => !value)}
          onPageSizeChange={handlePageSizeChange}
          onToggleGrid={handleToggleGrid}
          onPatchFrameDraft={applySelectedFrameDraftPatch}
          onDeleteFrame={handleDeleteSelectedFrame}
          onBringToFront={handleBringToFront}
          onSendBackward={handleSendBackward}
        />
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-[#0b1320] px-4 py-2 text-xs text-white/55">
        <p>WYSIWYG canvas v1 · Pages + frames are the canonical model for Sprint 7 PDF rendering.</p>
        <p>{pages.length} pages · {Object.values(framesByPageId).reduce((sum, frames) => sum + frames.length, 0)} frames</p>
      </div>

      {isPending ? (
        <div className="pointer-events-none absolute right-4 top-14 rounded-lg border border-white/10 bg-[#0d1626]/90 px-3 py-1 text-xs text-white/80">
          Working...
        </div>
      ) : null}
    </div>
  );
}
