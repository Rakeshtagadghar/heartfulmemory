"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";
import {
  type StorybookExportSettingsV1,
  normalizeStorybookExportSettingsV1
} from "../../../../packages/shared-schema/storybookSettings.types";
import type { StorybookDTO } from "../../lib/dto/storybook";
import type { PageDTO } from "../../lib/dto/page";
import type { FrameDTO } from "../../lib/dto/frame";
import type { AssetDTO } from "../../lib/dto/asset";
import type { NormalizedStockResult } from "../../lib/stock/types";
import {
  createFrameAction,
  createPageAction,
  createStockAssetAction,
  createUploadAssetAction,
  duplicatePageAction,
  ensureLayoutCanvasAction,
  listEditorAssetsAction,
  listFramesByStorybookAction,
  listPagesAction,
  removePageAction,
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
import { ImagePicker } from "./ImagePicker";
import { Button } from "../ui/button";
import { buildIssueHighlightMap } from "./CanvasFocus";
import { useInsertImage } from "./hooks/useInsertImage";
import { StudioToastsViewport } from "../studio/ui/ToastsViewport";
import { showStudioToast } from "../studio/ui/toasts";

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

export function Editor2Shell({ // NOSONAR
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
  const [editingTextFrameId, setEditingTextFrameId] = useState<string | null>(null);
  const [cropModeFrameId, setCropModeFrameId] = useState<string | null>(null);
  const [leftPanelMode, setLeftPanelMode] = useState<"pages" | "images">("pages");
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [storybookExportSettings, setStorybookExportSettings] = useState<StorybookExportSettingsV1>(() =>
    normalizeStorybookExportSettingsV1(storybook.settings, initialPages[0]?.size_preset, initialPages[0]?.margins)
  );
  const [preflightIssues, setPreflightIssues] = useState<ExportValidationIssue[]>([]);
  const [zoom, setZoom] = useState(0.85);
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [showMarginsOverlay, setShowMarginsOverlay] = useState(true);
  const [showSafeAreaOverlay, setShowSafeAreaOverlay] = useState(true);
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
  const { insertFromUploadAsset, insertFromProviderResult } = useInsertImage();
  let imagePanelAssetSummary = "";
  if (leftPanelMode === "images") {
    const assetStatusLabel = assetsLoading ? "loading assets…" : `${assets.length} assets`;
    imagePanelAssetSummary = ` · ${assetStatusLabel}`;
  }

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
  const selectedTextFrame = selectedFrame?.type === "TEXT" ? selectedFrame : null;
  const selectedImageFrame = selectedFrame?.type === "IMAGE" ? selectedFrame : null;
  const issueHighlightMap = useMemo(() => buildIssueHighlightMap(preflightIssues), [preflightIssues]);
  const currentPageIssueHighlights = useMemo(
    () => (effectiveSelectedPageId ? issueHighlightMap[effectiveSelectedPageId] ?? {} : {}),
    [effectiveSelectedPageId, issueHighlightMap]
  );
  const issueDisplayMeta = useMemo(() => {
    const pageNumberById: Record<string, number> = {};
    const frameNumberById: Record<string, number> = {};
    const orderedPages = [...pages].sort((a, b) => a.order_index - b.order_index);
    for (const [pageIndex, page] of orderedPages.entries()) {
      pageNumberById[page.id] = pageIndex + 1;
      const orderedFrames = sortFrames(framesByPageId[page.id] ?? []);
      for (const [frameIndex, frame] of orderedFrames.entries()) {
        frameNumberById[frame.id] = frameIndex + 1;
      }
    }
    return { pageNumberById, frameNumberById };
  }, [framesByPageId, pages]);

  const textAlignButtonLabel: Record<"left" | "center" | "right", string> = {
    left: "L",
    center: "C",
    right: "R"
  };

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
    save: async ({ frameId, ...patch }) => persistFramePatch(frameId, patch),
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

  async function handleDuplicatePage(pageId: string) {
    const result = await duplicatePageAction(storybook.id, pageId);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    const freshPages = await listPagesAction(storybook.id);
    if (freshPages.ok) {
      setPages(sortPages(freshPages.data));
    } else {
      setPages((current) => sortPages([...current, result.data]));
    }
    const freshFrames = await listFramesByStorybookAction(storybook.id);
    if (freshFrames.ok) {
      const nextByPage: Record<string, FrameDTO[]> = {};
      for (const page of (freshPages.ok ? freshPages.data : pages)) {
        nextByPage[page.id] = [];
      }
      for (const frame of freshFrames.data) {
        let list = nextByPage[frame.page_id];
        if (!list) {
          list = [];
          nextByPage[frame.page_id] = list;
        }
        list.push(frame);
      }
      setFramesByPageId(nextByPage);
    }
    setSelectedPageId(result.data.id);
    setSelectedFrameId(null);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
    setMessage("Page duplicated.");
  }

  async function handleDeletePage(pageId: string) {
    const page = pages.find((item) => item.id === pageId);
    if (!page) return;
    const result = await removePageAction(storybook.id, pageId);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    const nextPages = sortPages(pages.filter((item) => item.id !== pageId)).map((item, idx) => ({
      ...item,
      order_index: idx
    }));
    setPages(nextPages);
    setFramesByPageId((current) => {
      const next = { ...current };
      delete next[pageId];
      return next;
    });

    if (selectedPageId === pageId) {
      const nextSelected = nextPages[Math.min(page.order_index, Math.max(0, nextPages.length - 1))] ?? nextPages[0] ?? null;
      setSelectedPageId(nextSelected?.id ?? null);
      setSelectedFrameId(null);
      setEditingTextFrameId(null);
      setCropModeFrameId(null);
      setSelectedFrameDraftPatch({});
    }
    setMessage(nextPages.length === 0 ? "Page deleted. Add a new page to continue." : "Page deleted.");
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
    setCropModeFrameId(null);
    if (type === "IMAGE") {
      setLeftPanelMode("images");
      void refreshAssets();
    }
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

  const applySelectedFrameDraftPatch = useCallback((
    patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h" | "z_index" | "locked">> & {
      style?: Record<string, unknown>;
      content?: Record<string, unknown>;
      crop?: Record<string, unknown> | null;
    }
  ) => {
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
  }, [selectedFrame]);

  async function handleCommitFramePatch(frameId: string, patch: Partial<Pick<FrameDTO, "x" | "y" | "w" | "h">>) {
    const frame = currentFrames.find((item) => item.id === frameId);
    if (!frame) return;
    await persistFramePatch(frameId, {
      ...patch,
      expectedVersion: frame.version
    });
  }

  const handleDeleteSelectedFrame = useCallback(async () => {
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
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
  }, [selectedFrameId, selectedPageId, storybook.id]);

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
    setStorybookExportSettings((current) =>
      normalizeStorybookExportSettingsV1(
        { ...current, pageSize: preset, margins: result.data.margins },
        preset,
        result.data.margins
      )
    );
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
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
  }

  function handleNavigateToExportIssue(issue: ExportValidationIssue) {
    setSelectedPageId(issue.pageId);
    if (issue.frameId) {
      setSelectedFrameId(issue.frameId);
      setEditingTextFrameId(null);
      setCropModeFrameId(null);
    }
    if (issue.code.startsWith("PRINT_")) {
      setShowMarginsOverlay(true);
      setShowSafeAreaOverlay(true);
    }
  }

  function handleSelectFrame(frameId: string) {
    const frame = currentFrames.find((item) => item.id === frameId);
    setSelectedFrameId((current) => {
      if (current !== frameId) {
        setSelectedFrameDraftPatch({});
      }
      return frameId;
    });
    setEditingTextFrameId((current) => (current === frameId ? current : null));
    setCropModeFrameId((current) => (current === frameId ? current : null));
    if (frame?.type === "IMAGE") {
      setLeftPanelMode("images");
      void refreshAssets();
    }
  }

  function handleStartTextEdit(frameId: string) {
    setSelectedFrameId(frameId);
    setEditingTextFrameId(frameId);
    setCropModeFrameId((current) => (current === frameId ? null : current));
  }

  function handleEndTextEdit(frameId: string) {
    setEditingTextFrameId((current) => (current === frameId ? null : current));
  }

  function handleStartCropEdit(frameId: string) {
    setSelectedFrameId(frameId);
    setCropModeFrameId(frameId);
    setEditingTextFrameId((current) => (current === frameId ? null : current));
  }

  function handleEndCropEdit(frameId: string) {
    setCropModeFrameId((current) => (current === frameId ? null : current));
  }

  function handleCropChange(frameId: string, crop: { focalX: number; focalY: number; scale: number }) {
    const frame = currentFrames.find((item) => item.id === frameId);
    if (frame?.type !== "IMAGE") return;
    setFramesByPageId((current) => mergeFrameIntoMap(current, { ...frame, crop }));
    if (selectedFrameId === frameId) {
      setSelectedFrameDraftPatch((current) => ({ ...current, crop }));
    }
  }

  function handleTextContentChange(frameId: string, text: string) {
    const frame = currentFrames.find((item) => item.id === frameId);
    if (frame?.type !== "TEXT") return;
    const nextContent = { ...frame.content, kind: "text_frame_v1", text };
    setFramesByPageId((current) => mergeFrameIntoMap(current, { ...frame, content: nextContent }));
    if (selectedFrameId === frameId) {
      setSelectedFrameDraftPatch((current) => ({ ...current, content: nextContent }));
    }
  }

  function patchSelectedTextStyle(patch: Record<string, unknown>) {
    if (!selectedTextFrame) return;
    applySelectedFrameDraftPatch({
      style: {
        ...selectedTextFrame.style,
        ...patch
      }
    });
  }

  async function refreshAssets() {
    setAssetsLoading(true);
    const result = await listEditorAssetsAction(storybook.id, 60);
    setAssetsLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setAssets(result.data);
  }

  function openImagePanel() {
    setLeftPanelMode("images");
    void refreshAssets();
  }

  async function insertUploadAssetToCanvas(asset: AssetDTO) {
    const inserted = await insertFromUploadAsset({
      storybookId: storybook.id,
      page: selectedPage,
      currentFrames,
      asset
    });
    if (!inserted.ok) {
      if (inserted.error !== "Duplicate insert ignored." && inserted.error !== "Insert in progress.") {
        setMessage(inserted.error);
        showStudioToast({ kind: "error", title: "Insert failed", message: inserted.error });
      }
      return;
    }
    setFramesByPageId((current) => mergeFrameIntoMap(current, inserted.frame));
    setSelectedFrameId(inserted.frame.id);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
    setMessage(null);
    showStudioToast({ kind: "success", title: "Image inserted", message: "Added to the active page." });
  }

  async function handleCreateUploadAsset(input: {
    sourceUrl: string;
    storageKey?: string | null;
    mimeType: string;
    width?: number | null;
    height?: number | null;
    sizeBytes: number;
  }) {
    const result = await createUploadAssetAction(storybook.id, input);
    if (!result.ok) {
      setMessage(result.error);
      return { ok: false as const, error: result.error };
    }
    setAssets((current) => [result.data, ...current.filter((item) => item.id !== result.data.id)]);
    return { ok: true as const, asset: result.data };
  }

  async function handleInsertStockResult(result: NormalizedStockResult) {
    const created = await createStockAssetAction(storybook.id, {
      provider: result.provider.toUpperCase() as "UNSPLASH" | "PEXELS",
      sourceAssetId: result.assetId,
      sourceUrl: result.sourceUrl,
      previewUrl: result.previewUrl,
      fullUrl: result.fullUrl,
      width: result.width,
      height: result.height,
      mimeType: "image/jpeg",
      license: {
        provider: result.provider,
        licenseName: result.licenseName,
        licenseUrl: result.licenseUrl,
        requiresAttribution: result.requiresAttribution,
        attributionText: result.attributionText,
        authorName: result.authorName,
        authorUrl: result.authorUrl,
        sourceUrl: result.sourceUrl
      }
    });
    if (!created.ok) {
      setMessage(created.error);
      showStudioToast({ kind: "error", title: "Photo insert failed", message: created.error });
      return;
    }
    setAssets((current) => [created.data, ...current.filter((item) => item.id !== created.data.id)]);
    const inserted = await insertFromProviderResult({
      storybookId: storybook.id,
      page: selectedPage,
      currentFrames,
      asset: created.data,
      result
    });
    if (!inserted.ok) {
      if (inserted.error !== "Duplicate insert ignored." && inserted.error !== "Insert in progress.") {
        setMessage(inserted.error);
        showStudioToast({ kind: "error", title: "Photo insert failed", message: inserted.error });
      }
      return;
    }
    setFramesByPageId((current) => mergeFrameIntoMap(current, inserted.frame));
    setSelectedFrameId(inserted.frame.id);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
    setMessage(null);
    showStudioToast({ kind: "success", title: "Photo inserted", message: "Added to the active page." });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        !selectedFrame ||
        editingTextFrameId === selectedFrame.id ||
        cropModeFrameId === selectedFrame.id ||
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
        let patch: { x?: number; y?: number };
        switch (event.key) {
          case "ArrowUp":
            patch = { y: selectedFrame.y - nudge };
            break;
          case "ArrowDown":
            patch = { y: selectedFrame.y + nudge };
            break;
          case "ArrowLeft":
            patch = { x: selectedFrame.x - nudge };
            break;
          default:
            patch = { x: selectedFrame.x + nudge };
            break;
        }
        applySelectedFrameDraftPatch(patch);
      }
    }

    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [applySelectedFrameDraftPatch, cropModeFrameId, editingTextFrameId, handleDeleteSelectedFrame, selectedFrame, startTransition]);

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
          {selectedTextFrame ? (
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2 py-1 backdrop-blur">
              <input
                type="number"
                min={8}
                max={120}
                value={typeof selectedTextFrame.style.fontSize === "number" ? selectedTextFrame.style.fontSize : 15}
                onChange={(event) => patchSelectedTextStyle({ fontSize: Number(event.target.value) })}
                className="h-8 w-16 rounded-md border border-white/15 bg-black/20 px-2 text-xs text-white outline-none"
                aria-label="Font size"
              />
              <Button
                type="button"
                size="sm"
                variant={selectedTextFrame.style.fontWeight === 700 ? "secondary" : "ghost"}
                onClick={() =>
                  patchSelectedTextStyle({
                    fontWeight: selectedTextFrame.style.fontWeight === 700 ? 400 : 700
                  })
                }
              >
                B
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedTextFrame.style.fontStyle === "italic" ? "secondary" : "ghost"}
                onClick={() =>
                  patchSelectedTextStyle({
                    fontStyle: selectedTextFrame.style.fontStyle === "italic" ? "normal" : "italic"
                  })
                }
              >
                I
              </Button>
              <div className="mx-1 h-5 w-px bg-white/15" />
              {(["left", "center", "right"] as const).map((align) => (
                <Button
                  key={align}
                  type="button"
                  size="sm"
                  variant={(selectedTextFrame.style.align as string | undefined) === align ? "secondary" : "ghost"}
                  onClick={() => patchSelectedTextStyle({ align })}
                >
                  {textAlignButtonLabel[align]}
                </Button>
              ))}
            </div>
          ) : null}
          <ExportButton
            storybookId={storybook.id}
            storybookSettings={storybookExportSettings}
            issueDisplayMeta={issueDisplayMeta}
            onExportSettingsChange={setStorybookExportSettings}
            onIssueNavigate={handleNavigateToExportIssue}
            onIssuesUpdate={setPreflightIssues}
          />
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
              className={`h-9 w-9 cursor-pointer rounded-lg border text-[11px] font-semibold transition ${
                (label === "Img" && leftPanelMode === "images") || (label === "Pg" && leftPanelMode === "pages")
                  ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/[0.06]"
              }`}
              onClick={() => {
                if (label === "Img") openImagePanel();
                if (label === "Pg") setLeftPanelMode("pages");
                if (label === "Grid") setShowGridOverlay((value) => !value);
                if (label === "T") void handleAddFrame("TEXT");
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {leftPanelMode === "images" ? (
          <ImagePicker
            storybookId={storybook.id}
            open
            recentAssets={assets}
            selectedFrameLabel={
              selectedImageFrame ? `image frame on page ${(selectedPage?.order_index ?? 0) + 1}` : undefined
            }
            onClose={() => setLeftPanelMode("pages")}
            onInsertUploadAsset={(asset) => {
              void insertUploadAssetToCanvas(asset);
            }}
            onCreateUploadAsset={handleCreateUploadAsset}
            onInsertStockResult={handleInsertStockResult}
          />
        ) : (
          <PagesPanel
            pages={pages}
            selectedPageId={effectiveSelectedPageId}
            framesByPageId={framesByPageId}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            onMovePage={handleMovePage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
          />
        )}

        <div className="relative min-w-0 flex-1">
          <CanvasStage
            page={selectedPage}
            frames={currentFrames}
            selectedFrameId={selectedFrameId}
            zoom={zoom}
            showGrid={showGridOverlay}
            showMarginsOverlay={showMarginsOverlay}
            showSafeAreaOverlay={showSafeAreaOverlay}
            safeAreaPadding={storybookExportSettings.printPreset.safeAreaPadding}
            issueHighlightMessagesByFrameId={currentPageIssueHighlights}
            snapEnabled={snapEnabled}
            editingTextFrameId={editingTextFrameId}
            cropModeFrameId={cropModeFrameId}
            onSelectFrame={handleSelectFrame}
            onStartTextEdit={handleStartTextEdit}
            onEndTextEdit={handleEndTextEdit}
            onTextContentChange={handleTextContentChange}
            onStartCropEdit={handleStartCropEdit}
            onEndCropEdit={handleEndCropEdit}
            onCropChange={handleCropChange}
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
                <Button type="button" size="sm" variant={showMarginsOverlay ? "secondary" : "ghost"} onClick={() => setShowMarginsOverlay((value) => !value)}>
                  Margins
                </Button>
                <Button type="button" size="sm" variant={showSafeAreaOverlay ? "secondary" : "ghost"} onClick={() => setShowSafeAreaOverlay((value) => !value)}>
                  Safe Area
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
          onOpenImagePicker={selectedImageFrame ? openImagePanel : undefined}
          onStartCropMode={selectedImageFrame ? () => handleStartCropEdit(selectedImageFrame.id) : undefined}
          onEndCropMode={selectedImageFrame ? () => handleEndCropEdit(selectedImageFrame.id) : undefined}
          cropModeActive={selectedImageFrame ? cropModeFrameId === selectedImageFrame.id : false}
        />
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-[#0b1320] px-4 py-2 text-xs text-white/55">
        <p>WYSIWYG canvas v1 · Pages + frames are the canonical model for Sprint 7 PDF rendering.</p>
        <p>
          {pages.length} pages · {Object.values(framesByPageId).reduce((sum, frames) => sum + frames.length, 0)} frames
          {imagePanelAssetSummary}
        </p>
      </div>

      {isPending ? (
        <div className="pointer-events-none absolute right-4 top-14 rounded-lg border border-white/10 bg-[#0d1626]/90 px-3 py-1 text-xs text-white/80">
          Working...
        </div>
      ) : null}
      <StudioToastsViewport />
    </div>
  );
}
