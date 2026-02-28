"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { buildIssueHighlightMap } from "./CanvasFocus";
import { useInsertImage } from "./hooks/useInsertImage";
import { StudioToastsViewport } from "../studio/ui/ToastsViewport";
import { showStudioToast } from "../studio/ui/toasts";
import { StudioShellV2 } from "../studio/shell/StudioShellV2";
import { useHoverPanelController } from "../studio/shell/useHoverPanelController";
import type { StudioShellPanelId } from "../studio/shell/miniSidebarConfig";
import {
  captureStudioError,
  recordStudioMilestone,
  withStudioSpan
} from "../studio/observability";
import { MemoriosoLogo } from "../memorioso-logo";
import { trackAuthLogout } from "../../lib/analytics/events_auth";
import { PlanStatusBanner } from "../billing/PlanStatusBanner";
import { TextPanel } from "../studio/panels/TextPanel";
import { ElementsPanel } from "../studio/panels/ElementsPanel";
import { UploadsPanel } from "../studio/panels/UploadsPanel";
import { PhotosPanel } from "../studio/panels/PhotosPanel";
import { ToolsPanel } from "../studio/panels/ToolsPanel";
import { CropPanel } from "../studio/panels/CropPanel";
import {
  buildCenteredTextFrameInput,
  getTextInsertPreset,
  type TextPresetId
} from "../../../../packages/editor/commands/insertText";
import { buildUpdatedTextStyle } from "../../../../packages/editor/commands/updateTextStyle";
import { buildDuplicatedFrameInput } from "../../../../packages/editor/commands/duplicateNode";
import { buildFrameFillImagePatch } from "../../../../packages/editor/commands/fillFrameWithImage";
import { toggleNodeLocked } from "../../../../packages/editor/commands/lockNode";
import { migrateTextFrameToTextNodeV1 } from "../../../../packages/editor/serialize/migrations/textNodeV1";
import { normalizeTextNodeStyleV1 } from "../../../../packages/editor/nodes/textNode";
import {
  buildClipboardFramePayload,
  buildClipboardFramesPayload,
  getNodeClipboard,
  setNodeClipboard
} from "../../../../packages/editor/clipboard/nodeClipboard";
import {
  isEditableTextTarget,
  isNodeCopyShortcut,
  isNodeDuplicateShortcut,
  isNodePasteShortcut,
  isNodeBringForwardShortcut,
  isNodeLockShortcut,
  isNodeSendBackwardShortcut
} from "../../../../packages/editor/shortcuts/shortcuts";
import { buildCenteredShapeFrameInput } from "../../../../packages/editor/commands/insertShape";
import { buildCenteredLineFrameInput } from "../../../../packages/editor/commands/insertLine";
import { buildCenteredPlaceholderFrameInput } from "../../../../packages/editor/commands/insertFrame";
import { buildCenteredGridGroupInput, type GridPresetId } from "../../../../packages/editor/commands/insertGrid";
import { buildApplyCropPatch } from "../../../../packages/editor/commands/applyCrop";
import { buildCropRotationPatch } from "../../../../packages/editor/commands/updateCropRotation";
import { buildAlignToPagePatches } from "../../../../packages/editor/commands/alignToPage";
import { buildAlignToSelectionPatches } from "../../../../packages/editor/commands/alignToSelection";
import { buildDistributePatches } from "../../../../packages/editor/commands/distribute";
import { bringForward, bringToFront, sendBackward, sendToBack } from "../../../../packages/editor/commands/layerCommands";
import { buildFrameInputsFromClipboard } from "../../../../packages/editor/commands/pasteNodes";
import { buildToggleLockSelectionPatches } from "../../../../packages/editor/commands/toggleLock";
import { buildDrawOrderFromNodes, drawOrderToZIndexPatches } from "../../../../packages/editor/layers/layerModel";
import type { ElementsCatalogItemId } from "../studio/panels/elementsCatalog";
import type { DraggedMediaPayload } from "../studio/dnd/frameDropTarget";
import type { NodeMenuActionId } from "../studio/menus/menuActions";
import { buildSelectionState, clearSelection, withSelectionBounds } from "../../../../packages/editor/selection/selectionState";
import { getSelectedNodes, isDistributionEligible } from "../../../../packages/editor/selection/selectionHelpers";
import {
  normalizeCropModelV1,
  resetCropModelV1,
  serializeCropModelV1,
  type CropModelV1
} from "../../../../packages/editor/models/cropModel";
import { updateCropZoomConstrained } from "../../../../packages/editor/interaction/cropPanZoom";
import { canEnterCropMode, canEnterTextEdit } from "../../../../packages/editor/interaction/lockGuards";

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

type EditorFramePatch = Partial<Pick<FrameDTO, "x" | "y" | "w" | "h" | "z_index" | "locked">> & {
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
  crop?: Record<string, unknown> | null;
};

type EditorFramePatchRequest = {
  id: string;
  patch: EditorFramePatch;
};

function getAssetPreviewUrl(asset: AssetDTO) {
  return asset.storage_provider === "R2"
    ? `/api/assets/view/${asset.id}?purpose=preview`
    : asset.source_url ?? "";
}

function buildStockAssetCreateInput(result: NormalizedStockResult) {
  return {
    provider: result.provider.toUpperCase() as "UNSPLASH" | "PEXELS",
    sourceAssetId: result.assetId,
    sourceUrl: result.sourceUrl,
    previewUrl: result.previewUrl,
    fullUrl: result.fullUrl,
    width: result.width,
    height: result.height,
    mimeType: "image/jpeg" as const,
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
  };
}

function buildStockFrameAttribution(result: NormalizedStockResult) {
  return {
    provider: result.provider,
    authorName: result.authorName,
    authorUrl: result.authorUrl,
    assetUrl: result.sourceUrl,
    licenseUrl: result.licenseUrl,
    attributionText: result.attributionText
  };
}

function initialsFromLabel(value: string | null | undefined) {
  const source = (value ?? "").trim();
  if (!source) return "M";
  if (source.includes("@")) return source.slice(0, 1).toUpperCase();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function FooterCanvasToggleButton({
  label,
  active,
  onClick,
  children
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        title={label}
        className={[
          "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition",
          active
            ? "border-cyan-300/35 bg-cyan-400/12 text-cyan-100"
            : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
        ].join(" ")}
        onClick={onClick}
      >
        {children}
      </button>
      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0a111d]/95 px-2 py-1 text-[10px] text-white/90 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </div>
    </div>
  );
}

function isCropEditableFrame(frame: FrameDTO | null): frame is FrameDTO & { type: "IMAGE" | "FRAME" } {
  if (!frame) return false;
  if (frame.type === "IMAGE") return true;
  if (frame.type !== "FRAME") return false;
  const imageRef = frame.content?.imageRef;
  if (!imageRef || typeof imageRef !== "object" || Array.isArray(imageRef)) return false;
  const src = (imageRef as Record<string, unknown>).sourceUrl;
  const preview = (imageRef as Record<string, unknown>).previewUrl;
  return (typeof src === "string" && src.length > 0) || (typeof preview === "string" && preview.length > 0);
}

export function Editor2Shell({// NOSONAR
  storybook,
  initialPages,
  initialFramesByPageId,
  initialSelectedPageId = null,
  fullscreen = false,
  userEmail = null,
  userDisplayName = null
}: {
  storybook: StorybookDTO;
  initialPages: PageDTO[];
  initialFramesByPageId: Record<string, FrameDTO[]>;
  initialSelectedPageId?: string | null;
  fullscreen?: boolean;
  userEmail?: string | null;
  userDisplayName?: string | null;
}) {
  const [pages, setPages] = useState(sortPages(initialPages));
  const [framesByPageId, setFramesByPageId] =
    useState<Record<string, FrameDTO[]>>(initialFramesByPageId);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialSelectedPageId && initialPages.some((page) => page.id === initialSelectedPageId)
      ? initialSelectedPageId
      : (initialPages[0]?.id ?? null)
  );
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
  const [editingTextFrameId, setEditingTextFrameId] = useState<string | null>(null);
  const [cropModeFrameId, setCropModeFrameId] = useState<string | null>(null);
  const [cropDraft, setCropDraft] = useState<{
    frameId: string;
    value: CropModelV1;
    originalCrop: Record<string, unknown> | null;
    previousPanelId: StudioShellPanelId | null;
    previousPinnedPanelId: StudioShellPanelId | null;
  } | null>(null);
  const [textPanelView, setTextPanelView] = useState<"presets" | "fonts" | "colors">("presets");
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
  const [canvasOnlyFullscreen, setCanvasOnlyFullscreen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFrameDraftPatch, setSelectedFrameDraftPatch] = useState<EditorFramePatch>({});
  const [isPending, startTransition] = useTransition();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const shellContainerRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const studioShell = useHoverPanelController();
  const effectiveSelectedPageId = selectedPageId ?? pages[0]?.id ?? null;
  const { insertFromUploadAsset, insertFromProviderResult } = useInsertImage();
  let imagePanelAssetSummary = "";
  if (studioShell.openPanelId === "uploads" || studioShell.openPanelId === "photos") {
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
  const selectedFrames = useMemo(
    () => getSelectedNodes(currentFrames, selectedFrameIds),
    [currentFrames, selectedFrameIds]
  );
  const selectionState = useMemo(() => {
    const base = buildSelectionState({
      selectedIds: selectedFrameIds,
      primaryId: selectedFrameId
    });
    return withSelectionBounds(
      base,
      selectedFrames.map((frame) => ({ id: frame.id, x: frame.x, y: frame.y, w: frame.w, h: frame.h }))
    );
  }, [selectedFrameId, selectedFrameIds, selectedFrames]);
  const selectionBounds = selectionState.bounds;
  const selectedTextFrame = selectedFrame?.type === "TEXT" ? selectedFrame : null;
  const selectedTextStyle = useMemo(
    () => (selectedTextFrame ? normalizeTextNodeStyleV1(selectedTextFrame.style) : null),
    [selectedTextFrame]
  );
  const issueHighlightMap = useMemo(() => buildIssueHighlightMap(preflightIssues), [preflightIssues]);
  const avatarLabel = userDisplayName || userEmail || "Member";
  const avatarInitials = initialsFromLabel(avatarLabel);
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

  const allFrames = useMemo(
    () => Object.values(framesByPageId).flat(),
    [framesByPageId]
  );
  const selectedCropTargetFrame = useMemo(
    () => (isCropEditableFrame(selectedFrame) ? selectedFrame : null),
    [selectedFrame]
  );
  const cropDraftByFrameId = useMemo(() => {
    if (!cropDraft) return {};
    return {
      [cropDraft.frameId]: serializeCropModelV1(cropDraft.value)
    } as Record<string, Record<string, unknown>>;
  }, [cropDraft]);

  useEffect(() => {
    recordStudioMilestone("ui_action", "studio_open", {
      flow: "studio_open",
      storybookId: storybook.id,
      pageId: effectiveSelectedPageId ?? undefined
    }, "success");
  }, [effectiveSelectedPageId, storybook.id]);

  const persistFramePatch = useCallback(async (frameId: string, patch: Parameters<typeof updateFrameAction>[2]) => {
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
  }, [selectedFrameId, storybook.id]);

  function findFrameById(frameId: string) {
    return (
      currentFrames.find((frame) => frame.id === frameId) ??
      allFrames.find((frame) => frame.id === frameId) ??
      null
    );
  }

  function setPrimarySelection(
    nextPrimaryId: string | null,
    nextSelectedIds: string[],
    options?: { preserveModes?: boolean }
  ) {
    const deduped = [...new Set(nextSelectedIds.filter((id) => id.length > 0))];
    const primaryId = nextPrimaryId && deduped.includes(nextPrimaryId) ? nextPrimaryId : (deduped[0] ?? null);
    setSelectedFrameIds(deduped);
    setSelectedFrameId((current) => {
      if (current !== primaryId) {
        setSelectedFrameDraftPatch({});
      }
      return primaryId;
    });
    if (!options?.preserveModes) {
      setEditingTextFrameId((current) => (primaryId && current === primaryId ? current : null));
      setCropModeFrameId((current) => (primaryId && current === primaryId ? current : null));
    }
  }

  const persistFramePatches = useCallback(async (patches: EditorFramePatchRequest[]) => {
    if (patches.length === 0) return { ok: true as const };
    const frameById = new Map(allFrames.map((frame) => [frame.id, frame]));
    for (const { id, patch } of patches) {
      const frame = frameById.get(id);
      if (!frame) continue;
      const result = await persistFramePatch(id, {
        ...patch,
        expectedVersion: frame.version
      });
      if (!result.ok) {
        return { ok: false as const, error: result.error };
      }
    }
    return { ok: true as const };
  }, [allFrames, persistFramePatch]);

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

  async function handleAddPage() {
    const result = await createPageAction(storybook.id, selectedPage?.size_preset ?? "BOOK_8_5X11");
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setPages((current) => sortPages([...current, result.data]));
    setSelectedPageId(result.data.id);
    setSelectedFrameIds([]);
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
    setSelectedFrameIds([]);
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
      setSelectedFrameIds([]);
      setSelectedFrameId(null);
      setEditingTextFrameId(null);
      setCropModeFrameId(null);
      setSelectedFrameDraftPatch({});
    }
    setMessage(nextPages.length === 0 ? "Page deleted. Add a new page to continue." : "Page deleted.");
  }

  async function handleInsertElement(itemId: ElementsCatalogItemId) {
    if (!selectedPage) return;
    recordStudioMilestone("editor_action", "insert_element", {
      flow: "studio_insert_element",
      storybookId: storybook.id,
      pageId: selectedPage.id,
      nodeType: itemId
    }, "start");
    let input:
      | Parameters<typeof createFrameAction>[2]
      | null = null;

    if (itemId === "rect") {
      input = buildCenteredShapeFrameInput({
        pageWidth: selectedPage.width_px,
        pageHeight: selectedPage.height_px,
        shapeType: "rect"
      });
    } else if (itemId === "circle") {
      input = buildCenteredShapeFrameInput({
        pageWidth: selectedPage.width_px,
        pageHeight: selectedPage.height_px,
        shapeType: "circle"
      });
    } else if (itemId === "line") {
      input = buildCenteredLineFrameInput({
        pageWidth: selectedPage.width_px,
        pageHeight: selectedPage.height_px
      });
    } else if (itemId === "frame") {
      input = buildCenteredPlaceholderFrameInput({
        pageWidth: selectedPage.width_px,
        pageHeight: selectedPage.height_px
      });
    } else if (itemId === "grid_2_col" || itemId === "grid_3_col" || itemId === "grid_2x2") {
      input = buildCenteredGridGroupInput({
        pageWidth: selectedPage.width_px,
        pageHeight: selectedPage.height_px,
        preset: itemId as GridPresetId
      });
    }

    if (!input) return;
    const result = await createFrameAction(storybook.id, selectedPage.id, input);
    if (!result.ok) {
      setMessage(result.error);
      captureStudioError(result.error, {
        flow: "studio_insert_element",
        storybookId: storybook.id,
        pageId: selectedPage.id,
        nodeType: itemId
      });
      return;
    }
    setFramesByPageId((current) => mergeFrameIntoMap(current, result.data));
    setPrimarySelection(result.data.id, [result.data.id]);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
    setMessage(null);
    recordStudioMilestone("editor_action", "insert_element", {
      flow: "studio_insert_element",
      storybookId: storybook.id,
      pageId: selectedPage.id,
      nodeType: result.data.type
    }, "success");
  }

  async function handleAddTextPreset(presetId: TextPresetId) {
    if (!selectedPage) return;
    const preset = getTextInsertPreset(presetId);
    const migrated = migrateTextFrameToTextNodeV1({
      content: { text: preset.text },
      style: preset.style as Record<string, unknown>
    });
    const input = buildCenteredTextFrameInput({
      pageWidth: selectedPage.width_px,
      pageHeight: selectedPage.height_px,
      preset,
      style: migrated.style
    });
    const result = await createFrameAction(storybook.id, selectedPage.id, {
      ...input,
      content: migrated.content
    });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setFramesByPageId((current) => mergeFrameIntoMap(current, result.data));
    setPrimarySelection(result.data.id, [result.data.id], { preserveModes: true });
    setEditingTextFrameId(result.data.id);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
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

  const applySelectedFrameDraftPatch = useCallback((patch: EditorFramePatch) => {
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
    const frame = currentFrames.find((item) => item.id === selectedFrameId);
    if (frame?.locked) {
      setMessage("Unlock the frame before deleting.");
      return;
    }
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
    setSelectedFrameIds([]);
    setSelectedFrameId(null);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
  }, [currentFrames, selectedFrameId, selectedPageId, storybook.id]);

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
    if (selectedFrame.locked) return;
    const maxZ = Math.max(0, ...currentFrames.map((frame) => frame.z_index));
    applySelectedFrameDraftPatch({ z_index: maxZ + 1 });
  }

  function handleSendBackward() {
    if (!selectedFrame) return;
    if (selectedFrame.locked) return;
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
      setPrimarySelection(issue.frameId, [issue.frameId]);
      setEditingTextFrameId(null);
      setCropModeFrameId(null);
    }
    if (issue.code.startsWith("PRINT_")) {
      setShowMarginsOverlay(true);
      setShowSafeAreaOverlay(true);
    }
  }

  function handleSelectFrame(frameId: string, options?: { additive?: boolean; preserveIfSelected?: boolean }) {
    const frame = currentFrames.find((item) => item.id === frameId);
    if (options?.additive) {
      const alreadySelected = selectedFrameIds.includes(frameId);
      const nextIds = alreadySelected
        ? selectedFrameIds.filter((id) => id !== frameId)
        : [...selectedFrameIds, frameId];
      let nextPrimaryId: string | null = frameId;
      if (alreadySelected) {
        nextPrimaryId = selectedFrameId === frameId ? (nextIds[0] ?? null) : selectedFrameId;
      }
      setPrimarySelection(nextPrimaryId, nextIds);
    } else if (options?.preserveIfSelected && selectedFrameIds.includes(frameId)) {
      setPrimarySelection(selectedFrameId ?? frameId, selectedFrameIds, { preserveModes: true });
    } else {
      setPrimarySelection(frameId, [frameId]);
    }
    if (frame?.type === "IMAGE" && !options?.additive) {
      openImagePanel();
    }
    recordStudioMilestone("editor_action", "selection_change", {
      flow: "studio_selection",
      storybookId: storybook.id,
      pageId: frame?.page_id ?? selectedPage?.id ?? undefined,
      nodeType: frame?.type ?? undefined,
      selectionCount: options?.additive ? selectedFrameIds.length + 1 : 1
    });
  }

  function handleStartTextEdit(frameId: string) {
    const frame = findFrameById(frameId);
    if (!canEnterTextEdit(frame)) return;
    setPrimarySelection(frameId, [frameId], { preserveModes: true });
    setEditingTextFrameId(frameId);
    setCropModeFrameId((current) => (current === frameId ? null : current));
  }

  function handleEndTextEdit(frameId: string) {
    setEditingTextFrameId((current) => (current === frameId ? null : current));
  }

  function handleStartCropEdit(frameId: string) {
    const frame = findFrameById(frameId);
    if (!isCropEditableFrame(frame) || !canEnterCropMode(frame)) return;
    setPrimarySelection(frameId, [frameId], { preserveModes: true });
    setCropModeFrameId(frameId);
    setEditingTextFrameId((current) => (current === frameId ? null : current));
    const mode = frame.type === "FRAME" ? "frame" : "free";
    const objectFit = frame.type === "FRAME" ? "cover" : "contain";
    setCropDraft({
      frameId,
      value: normalizeCropModelV1(frame.crop, { mode, objectFit }),
      originalCrop: frame.crop ?? null,
      previousPanelId: studioShell.openPanelId,
      previousPinnedPanelId: studioShell.pinnedPanelId
    });
    studioShell.openPanel("crop", "mouse", true);
    recordStudioMilestone("editor_action", "crop_enter", {
      flow: "studio_crop",
      storybookId: storybook.id,
      pageId: frame.page_id,
      nodeType: frame.type
    }, "start");
  }

  function handleCropChange(frameId: string, crop: Record<string, unknown>) {
    setCropDraft((current) => {
      if (current?.frameId !== frameId) return current;
      const frame = findFrameById(frameId);
      const mode = frame?.type === "FRAME" ? "frame" : "free";
      const objectFit = frame?.type === "FRAME" ? "cover" : "contain";
      return {
        ...current,
        value: normalizeCropModelV1(crop, { mode, objectFit })
      };
    });
  }

  function restorePanelAfterCropExit(session: {
    previousPanelId: StudioShellPanelId | null;
    previousPinnedPanelId: StudioShellPanelId | null;
  }) {
    if (!session.previousPanelId || session.previousPanelId === "crop") {
      studioShell.closePanel("mouse");
      return;
    }
    studioShell.openPanel(
      session.previousPanelId,
      "mouse",
      session.previousPinnedPanelId === session.previousPanelId
    );
  }

  async function handleApplyCropEdit(frameId: string) {
    const session = cropDraft;
    if (session?.frameId !== frameId) return;
    const frame = findFrameById(frameId);
    if (!frame) return;
    const startedAt = Date.now();
    const result = await withStudioSpan(
      "studio_crop_apply",
      {
        flow: "studio_crop",
        storybookId: storybook.id,
        pageId: frame.page_id,
        nodeType: frame.type
      },
      () =>
        persistFramePatch(frameId, buildApplyCropPatch({
          cropDraft: session.value,
          expectedVersion: frame.version
        }))
    );
    if (!result.ok) {
      setMessage(result.error);
      showStudioToast({ kind: "error", title: "Crop apply failed", message: result.error });
      captureStudioError(result.error, {
        flow: "studio_crop",
        storybookId: storybook.id,
        pageId: frame.page_id,
        nodeType: frame.type
      });
      recordStudioMilestone("editor_action", "crop_apply", {
        flow: "studio_crop",
        storybookId: storybook.id,
        pageId: frame.page_id,
        nodeType: frame.type,
        durationMs: Date.now() - startedAt
      }, "failed");
      return;
    }
    setCropModeFrameId((current) => (current === frameId ? null : current));
    setCropDraft(null);
    restorePanelAfterCropExit(session);
    showStudioToast({ kind: "success", title: "Crop applied", message: "Image crop was saved." });
    recordStudioMilestone("editor_action", "crop_apply", {
      flow: "studio_crop",
      storybookId: storybook.id,
      pageId: frame.page_id,
      nodeType: frame.type,
      durationMs: Date.now() - startedAt
    }, "success");
  }

  function handleCancelCropEdit(frameId: string) {
    setCropModeFrameId((current) => (current === frameId ? null : current));
    setCropDraft((current) => {
      if (current?.frameId !== frameId) return current;
      restorePanelAfterCropExit(current);
      return null;
    });
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
      style: buildUpdatedTextStyle(selectedTextFrame.style, patch)
    });
  }

  function openTextFontPanel() {
    setTextPanelView("fonts");
    studioShell.openPanel("text", "mouse", true);
  }

  function openTextColorPanel() {
    setTextPanelView("colors");
    studioShell.openPanel("text", "mouse", true);
  }

  function handleClearSelection() {
    const emptySelection = clearSelection();
    if (cropDraft?.frameId === cropModeFrameId) {
      restorePanelAfterCropExit(cropDraft);
    }
    setSelectedFrameIds(emptySelection.selectedIds);
    setSelectedFrameId(emptySelection.primaryId);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setCropDraft(null);
    setSelectedFrameDraftPatch({});
  }

  const createFramesAndSelect = useCallback(async (inputs: Parameters<typeof createFrameAction>[2][]) => {
    if (!selectedPage || inputs.length === 0) return { ok: false as const, error: "No page selected." };
    const created: FrameDTO[] = [];
    for (const input of inputs) {
      const result = await createFrameAction(storybook.id, selectedPage.id, input);
      if (!result.ok) {
        setMessage(result.error);
        return { ok: false as const, error: result.error };
      }
      created.push(result.data);
      setFramesByPageId((current) => mergeFrameIntoMap(current, result.data));
    }
    const nextIds = created.map((frame) => frame.id);
    setPrimarySelection(nextIds.at(-1) ?? null, nextIds);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
    return { ok: true as const, data: created };
  }, [selectedPage, storybook.id]);

  const handleDuplicateSelection = useCallback(async () => {
    if (!selectedPage || selectedFrames.length === 0) return;
    const orderedSelection = [...selectedFrames].sort((a, b) => a.z_index - b.z_index);
    if (orderedSelection.length === 1) {
      const payload = buildDuplicatedFrameInput(orderedSelection[0]);
      const result = await createFramesAndSelect([payload]);
      if (result.ok) {
        setMessage(`${orderedSelection[0].type === "TEXT" ? "Text box" : "Frame"} duplicated.`);
      }
      return;
    }
    const clipboardPayload = buildClipboardFramesPayload(orderedSelection);
    const inputs = buildFrameInputsFromClipboard(clipboardPayload);
    const result = await createFramesAndSelect(inputs);
    if (result.ok) {
      setMessage(`${orderedSelection.length} items duplicated.`);
    }
  }, [createFramesAndSelect, selectedFrames, selectedPage]);

  async function handleDuplicateSelectedTextFrame() {
    await handleDuplicateSelection();
  }

  const handleDuplicateSelectedFrame = useCallback(async () => {
    await handleDuplicateSelection();
  }, [handleDuplicateSelection]);

  const handleCopySelectedFrame = useCallback(() => {
    if (selectedFrames.length === 0) return;
    const orderedSelection = [...selectedFrames].sort((a, b) => a.z_index - b.z_index);
    if (orderedSelection.length === 1) {
      setNodeClipboard(buildClipboardFramePayload(orderedSelection[0]));
      setMessage(`${orderedSelection[0].type === "TEXT" ? "Text box" : "Frame"} copied.`);
      return;
    }
    setNodeClipboard(buildClipboardFramesPayload(orderedSelection));
    setMessage(`${orderedSelection.length} items copied.`);
  }, [selectedFrames]);

  const handlePasteClipboardFrame = useCallback(async () => {
    if (!selectedPage) return;
    const clipboard = getNodeClipboard();
    const inputs = buildFrameInputsFromClipboard(clipboard);
    if (inputs.length === 0) return;
    const result = await createFramesAndSelect(inputs);
    if (!result.ok) return;
    setMessage(inputs.length === 1 ? "Item pasted." : `${inputs.length} items pasted.`);
  }, [createFramesAndSelect, selectedPage]);

  const handleToggleSelectedFrameLock = useCallback(async () => {
    if (selectedFrames.length === 0) return;
    if (selectedFrames.length === 1 && selectedFrame) {
      applySelectedFrameDraftPatch(toggleNodeLocked(selectedFrame.locked));
      return;
    }
    const patches = buildToggleLockSelectionPatches(currentFrames, selectedFrameIds).map((patch) => ({
      id: patch.id,
      patch: { locked: patch.locked }
    }));
    const result = await persistFramePatches(patches);
    if (!result.ok) return;
    setMessage("Selection lock updated.");
  }, [
    applySelectedFrameDraftPatch,
    currentFrames,
    persistFramePatches,
    selectedFrame,
    selectedFrameIds,
    selectedFrames
  ]);

  async function applyGeometryPatches(
    patches: Array<{ id: string; x?: number; y?: number }>,
    successMessage: string
  ) {
    const framePatchList = patches.map((patch) => ({
      id: patch.id,
      patch: {
        ...(typeof patch.x === "number" ? { x: patch.x } : {}),
        ...(typeof patch.y === "number" ? { y: patch.y } : {})
      }
    }));
    const result = await persistFramePatches(framePatchList);
    if (!result.ok) return;
    setMessage(successMessage);
  }

  const handleLayerAction = useCallback(async (
    action: "bringForward" | "sendBackward" | "bringToFront" | "sendToBack"
  ) => {
    if (selectedFrames.length === 0) return;
    const drawOrder = buildDrawOrderFromNodes(currentFrames);
    const nextDrawOrder = (() => {
      if (action === "bringForward") {
        return bringForward(drawOrder, selectedFrameIds);
      }
      if (action === "sendBackward") {
        return sendBackward(drawOrder, selectedFrameIds);
      }
      if (action === "bringToFront") {
        return bringToFront(drawOrder, selectedFrameIds);
      }
      return sendToBack(drawOrder, selectedFrameIds);
    })();

    const currentZById = new Map(currentFrames.map((frame) => [frame.id, frame.z_index]));
    const patches = drawOrderToZIndexPatches(nextDrawOrder)
      .filter(({ id, z_index }) => currentZById.get(id) !== z_index)
      .map(({ id, z_index }) => ({ id, patch: { z_index } }));

    if (patches.length === 0) return;
    const result = await persistFramePatches(patches);
    if (!result.ok) return;
    setMessage("Layer order updated.");
    recordStudioMilestone("editor_action", "layer_operation", {
      flow: "studio_layers",
      storybookId: storybook.id,
      pageId: selectedPageId ?? undefined,
      selectionCount: selectedFrameIds.length
    }, "success");
  }, [currentFrames, persistFramePatches, selectedFrameIds, selectedFrames, selectedPageId, storybook.id]);

  async function handleAlignToPage(
    action: Parameters<typeof buildAlignToPagePatches>[2]
  ) {
    if (!selectedPage || selectedFrames.length === 0) return;
    const patches = buildAlignToPagePatches(selectedFrames, {
      width: selectedPage.width_px,
      height: selectedPage.height_px
    }, action);
    await applyGeometryPatches(patches, "Aligned to page.");
  }

  async function handleAlignToSelection(
    action: Parameters<typeof buildAlignToSelectionPatches>[2]
  ) {
    if (!selectionBounds || selectedFrames.length < 2) return;
    const patches = buildAlignToSelectionPatches(selectedFrames, selectionBounds, action);
    await applyGeometryPatches(patches, "Aligned selection.");
  }

  async function handleDistribute(
    action: Parameters<typeof buildDistributePatches>[1]
  ) {
    if (!isDistributionEligible(selectedFrames)) return;
    const patches = buildDistributePatches(selectedFrames, action);
    await applyGeometryPatches(patches, "Selection distributed.");
  }

  async function handleNodeMenuAction(action: NodeMenuActionId) { // NOSONAR
    if (action === "copy") return handleCopySelectedFrame();
    if (action === "paste") return handlePasteClipboardFrame();
    if (action === "duplicate") return handleDuplicateSelectedFrame();
    if (action === "delete") return handleDeleteSelection();
    if (action === "replaceImage") return openImagePanel();
    if (action === "lock" || action === "unlock") return handleToggleSelectedFrameLock();
    if (action === "bringForward") return handleLayerAction("bringForward");
    if (action === "sendBackward") return handleLayerAction("sendBackward");
    if (action === "bringToFront") return handleLayerAction("bringToFront");
    if (action === "sendToBack") return handleLayerAction("sendToBack");
    if (action === "alignPageLeft") return handleAlignToPage("left");
    if (action === "alignPageCenterX") return handleAlignToPage("centerX");
    if (action === "alignPageRight") return handleAlignToPage("right");
    if (action === "alignPageTop") return handleAlignToPage("top");
    if (action === "alignPageCenterY") return handleAlignToPage("centerY");
    if (action === "alignPageBottom") return handleAlignToPage("bottom");
    if (action === "alignSelectionLeft") return handleAlignToSelection("left");
    if (action === "alignSelectionCenterX") return handleAlignToSelection("centerX");
    if (action === "alignSelectionRight") return handleAlignToSelection("right");
    if (action === "alignSelectionTop") return handleAlignToSelection("top");
    if (action === "alignSelectionCenterY") return handleAlignToSelection("centerY");
    if (action === "alignSelectionBottom") return handleAlignToSelection("bottom");
    if (action === "distributeHorizontal") return handleDistribute("horizontal");
    if (action === "distributeVertical") return handleDistribute("vertical");
  }

  const handleDeleteSelection = useCallback(async () => {
    if (!selectedPageId || selectedFrames.length === 0) return;
    const unlockedIds = selectedFrames.filter((frame) => !frame.locked).map((frame) => frame.id);
    if (unlockedIds.length === 0) {
      setMessage("Unlock the selected items before deleting.");
      return;
    }
    for (const id of unlockedIds) {
      const result = await removeFrameAction(storybook.id, id);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
    }
    setFramesByPageId((current) => {
      const next = { ...current };
      next[selectedPageId] = (next[selectedPageId] ?? []).filter((frame) => !unlockedIds.includes(frame.id));
      return next;
    });
    setPrimarySelection(null, []);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
    setMessage(unlockedIds.length === 1 ? "Item deleted." : `${unlockedIds.length} items deleted.`);
  }, [selectedFrames, selectedPageId, storybook.id]);

  async function refreshAssets() {
    setAssetsLoading(true);
    const result = await listEditorAssetsAction(storybook.id, 60);
    setAssetsLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return null;
    }
    setAssets(result.data);
    return result.data;
  }

  const openPanelId = studioShell.openPanelId;
  // Load assets whenever the user opens the Uploads panel (sidebar click or programmatic)
  useEffect(() => {
    if (openPanelId === "uploads") {
      void refreshAssets();
    }
    // refreshAssets only uses storybook.id (stable); openPanelId is the real trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPanelId]);

  function openImagePanel() {
    studioShell.openPanel("uploads", "mouse", true);
  }

  function openPhotosPanel() {
    studioShell.openPanel("photos", "mouse", true);
  }

  async function fillFrameWithImageById(
    frameId: string,
    input: {
      asset: AssetDTO;
      sourceUrl: string;
      previewUrl?: string | null;
      attribution?: Record<string, unknown> | null;
    }
  ): Promise<boolean> {
    const targetFrame = findFrameById(frameId);
    if (targetFrame?.type !== "FRAME") return false;
    const nextContent = {
      ...buildFrameFillImagePatch(targetFrame.content, {
        assetId: input.asset.id,
        sourceUrl: input.sourceUrl,
        previewUrl: input.previewUrl,
        attribution: input.attribution
      }).content
    };
    const result = await persistFramePatch(targetFrame.id, {
      content: nextContent,
      expectedVersion: targetFrame.version
    });
    if (!result.ok) {
      setMessage(result.error);
      showStudioToast({ kind: "error", title: "Frame fill failed", message: result.error });
      return true;
    }
    setPrimarySelection(targetFrame.id, [targetFrame.id]);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
    setMessage(null);
    showStudioToast({ kind: "success", title: "Frame updated", message: "Image placed in the selected frame." });
    return true;
  }

  async function fillSelectedElementFrameWithImage(input: {
    asset: AssetDTO;
    sourceUrl: string;
    previewUrl?: string | null;
    attribution?: Record<string, unknown> | null;
  }): Promise<boolean> {
    if (selectedFrame?.type !== "FRAME") return false;
    return fillFrameWithImageById(selectedFrame.id, input);
  }

  async function insertUploadAssetToCanvas(asset: AssetDTO) {
    const uploadPreviewUrl = getAssetPreviewUrl(asset);
    const filledFrame = await fillSelectedElementFrameWithImage({
      asset,
      sourceUrl: uploadPreviewUrl,
      previewUrl: uploadPreviewUrl,
      attribution: { provider: "upload" }
    });
    if (filledFrame) return;

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
    setPrimarySelection(inserted.frame.id, [inserted.frame.id]);
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
    recordStudioMilestone("editor_action", "upload_asset_create", {
      flow: "studio_insert_media",
      storybookId: storybook.id,
      pageId: selectedPage?.id ?? undefined,
      nodeType: "upload"
    }, "start");
    const result = await createUploadAssetAction(storybook.id, input);
    if (!result.ok) {
      setMessage(result.error);
      captureStudioError(result.error, {
        flow: "studio_insert_media",
        storybookId: storybook.id,
        pageId: selectedPage?.id ?? undefined,
        nodeType: "upload"
      });
      recordStudioMilestone("editor_action", "upload_asset_create", {
        flow: "studio_insert_media",
        storybookId: storybook.id,
        pageId: selectedPage?.id ?? undefined,
        nodeType: "upload"
      }, "failed");
      return { ok: false as const, error: result.error };
    }
    setAssets((current) => [result.data, ...current.filter((item) => item.id !== result.data.id)]);
    recordStudioMilestone("editor_action", "upload_asset_create", {
      flow: "studio_insert_media",
      storybookId: storybook.id,
      pageId: selectedPage?.id ?? undefined,
      nodeType: "upload"
    }, "success");
    return { ok: true as const, asset: result.data };
  }

  async function handleInsertStockResult(result: NormalizedStockResult) {
    recordStudioMilestone("editor_action", "insert_photo", {
      flow: "studio_insert_media",
      storybookId: storybook.id,
      pageId: selectedPage?.id ?? undefined,
      provider: result.provider
    }, "start");
    const created = await createStockAssetAction(storybook.id, buildStockAssetCreateInput(result));
    if (!created.ok) {
      setMessage(created.error);
      showStudioToast({ kind: "error", title: "Photo insert failed", message: created.error });
      captureStudioError(created.error, {
        flow: "studio_insert_media",
        storybookId: storybook.id,
        pageId: selectedPage?.id ?? undefined,
        provider: result.provider
      });
      recordStudioMilestone("editor_action", "insert_photo", {
        flow: "studio_insert_media",
        storybookId: storybook.id,
        pageId: selectedPage?.id ?? undefined,
        provider: result.provider
      }, "failed");
      return;
    }
    setAssets((current) => [created.data, ...current.filter((item) => item.id !== created.data.id)]);
    const frameFillSourceUrl = result.previewUrl || result.fullUrl || created.data.source_url || "";
    const filledFrame = await fillSelectedElementFrameWithImage({
      asset: created.data,
      sourceUrl: frameFillSourceUrl,
      previewUrl: result.previewUrl,
      attribution: buildStockFrameAttribution(result)
    });
    if (filledFrame) return;
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
    setPrimarySelection(inserted.frame.id, [inserted.frame.id]);
    setEditingTextFrameId(null);
    setCropModeFrameId(null);
    setSelectedFrameDraftPatch({});
    setMessage(null);
    showStudioToast({ kind: "success", title: "Photo inserted", message: "Added to the active page." });
    recordStudioMilestone("editor_action", "insert_photo", {
      flow: "studio_insert_media",
      storybookId: storybook.id,
      pageId: selectedPage?.id ?? undefined,
      provider: result.provider
    }, "success");
  }

  async function handleDropMediaOnFrame(frameId: string, payload: DraggedMediaPayload) {
    const targetFrame = findFrameById(frameId);
    recordStudioMilestone("editor_action", "drop_media_on_frame", {
      flow: "studio_insert_media",
      storybookId: storybook.id,
      pageId: targetFrame?.page_id ?? selectedPage?.id ?? undefined,
      nodeType: targetFrame?.type ?? "FRAME"
    }, "start");
    if (payload.kind === "asset") {
      const targetAsset =
        assets.find((item) => item.id === payload.assetId) ??
        (await refreshAssets())?.find((item) => item.id === payload.assetId) ??
        null;
      if (!targetAsset) {
        setMessage("Dropped asset is not available.");
        return;
      }
      const sourceUrl =
        getAssetPreviewUrl(targetAsset);
      await fillFrameWithImageById(frameId, {
        asset: targetAsset,
        sourceUrl,
        previewUrl: sourceUrl,
        attribution: { provider: "upload" }
      });
      recordStudioMilestone("editor_action", "drop_media_on_frame", {
        flow: "studio_insert_media",
        storybookId: storybook.id,
        pageId: targetFrame?.page_id ?? selectedPage?.id ?? undefined,
        nodeType: targetFrame?.type ?? "FRAME",
        provider: "upload"
      }, "success");
      return;
    }

    const result = payload.result;
    const created = await createStockAssetAction(storybook.id, buildStockAssetCreateInput(result));
    if (!created.ok) {
      setMessage(created.error);
      showStudioToast({ kind: "error", title: "Photo insert failed", message: created.error });
      captureStudioError(created.error, {
        flow: "studio_insert_media",
        storybookId: storybook.id,
        pageId: targetFrame?.page_id ?? selectedPage?.id ?? undefined,
        provider: result.provider
      });
      recordStudioMilestone("editor_action", "drop_media_on_frame", {
        flow: "studio_insert_media",
        storybookId: storybook.id,
        pageId: targetFrame?.page_id ?? selectedPage?.id ?? undefined,
        nodeType: targetFrame?.type ?? "FRAME",
        provider: result.provider
      }, "failed");
      return;
    }
    setAssets((current) => [created.data, ...current.filter((item) => item.id !== created.data.id)]);
    const frameFillSourceUrl = result.previewUrl || result.fullUrl || created.data.source_url || "";
    await fillFrameWithImageById(frameId, {
      asset: created.data,
      sourceUrl: frameFillSourceUrl,
      previewUrl: result.previewUrl,
      attribution: buildStockFrameAttribution(result)
    });
    recordStudioMilestone("editor_action", "drop_media_on_frame", {
      flow: "studio_insert_media",
      storybookId: storybook.id,
      pageId: targetFrame?.page_id ?? selectedPage?.id ?? undefined,
      nodeType: targetFrame?.type ?? "FRAME",
      provider: result.provider
    }, "success");
  }

  const studioPanelContents = {
    pages: (
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
    ),
    layouts: (
      <TemplatePicker
        variant="panel"
        onApplyTemplate={handleApplyTemplate}
        disabled={!selectedPage}
      />
    ),
    text: (
      <TextPanel
        onAddTextBox={() => void handleAddTextPreset("textbox")}
        onAddPreset={(presetId) => void handleAddTextPreset(presetId)}
        initialView={textPanelView}
        onViewChange={setTextPanelView}
        selectedFontFamily={selectedTextStyle?.fontFamily ?? null}
        onSelectFont={(fontFamily) => patchSelectedTextStyle({ fontFamily })}
        selectedColor={selectedTextStyle?.color ?? "#1f2633"}
        onSelectColor={(color) => patchSelectedTextStyle({ color })}
      />
    ),
    elements: (
      <ElementsPanel
        onInsertElement={(id) => void handleInsertElement(id)}
        onOpenPhotos={openPhotosPanel}
      />
    ),
    uploads: (
      <UploadsPanel
        storybookId={storybook.id}
        recentAssets={assets}
        onCreated={(asset) => {
          void insertUploadAssetToCanvas(asset);
        }}
        createUploadAsset={handleCreateUploadAsset}
      />
    ),
    tools: (
      <ToolsPanel
        selectedFrame={selectedFrame}
        cropModeActive={cropModeFrameId === selectedCropTargetFrame?.id}
        textEditActive={editingTextFrameId === selectedTextFrame?.id}
      />
    ),
    photos: <PhotosPanel onInsert={handleInsertStockResult} />,
    crop:
      selectedCropTargetFrame && cropDraft?.frameId === selectedCropTargetFrame.id ? (
        <CropPanel
          frameType={selectedCropTargetFrame.type}
          crop={cropDraft.value}
          onZoomChange={(nextZoom) =>
            setCropDraft((current) =>
              current?.frameId === selectedCropTargetFrame.id
                ? { ...current, value: updateCropZoomConstrained(current.value, nextZoom) }
                : current
            )
          }
          onRotateStep={(deltaDeg) =>
            setCropDraft((current) =>
              current?.frameId === selectedCropTargetFrame.id
                ? {
                    ...current,
                    value: buildCropRotationPatch(current.value, deltaDeg)
                  }
                : current
            )
          }
          onReset={() =>
            setCropDraft((current) =>
              current?.frameId === selectedCropTargetFrame.id
                ? {
                    ...current,
                    value: resetCropModelV1(current.originalCrop, selectedCropTargetFrame.type === "FRAME" ? "frame" : "free")
                  }
                : current
            )
          }
          onCancel={() => handleCancelCropEdit(selectedCropTargetFrame.id)}
          onApply={() => void handleApplyCropEdit(selectedCropTargetFrame.id)}
        />
      ) : null
  };

  useEffect(() => {
    function onCropEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!cropModeFrameId || !cropDraft) return;
      event.preventDefault();
      event.stopImmediatePropagation?.();
      setCropModeFrameId((current) => (current === cropModeFrameId ? null : current));
      setCropDraft((current) => {
        if (current?.frameId !== cropModeFrameId) return current;
        if (!current.previousPanelId || current.previousPanelId === "crop") {
          studioShell.closePanel("mouse");
        } else {
          studioShell.openPanel(
            current.previousPanelId,
            "mouse",
            current.previousPinnedPanelId === current.previousPanelId
          );
        }
        return null;
      });
    }
    globalThis.addEventListener("keydown", onCropEscape);
    return () => globalThis.removeEventListener("keydown", onCropEscape);
  }, [cropDraft, cropModeFrameId, studioShell]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { // NOSONAR
      if (
        !selectedFrameId ||
        (editingTextFrameId && selectedFrameIds.includes(editingTextFrameId)) ||
        (cropModeFrameId && selectedFrameIds.includes(cropModeFrameId)) ||
        isEditableTextTarget(event.target)
      ) {
        return;
      }

      if (isNodeCopyShortcut(event)) {
        event.preventDefault();
        handleCopySelectedFrame();
        return;
      }

      if (isNodePasteShortcut(event)) {
        event.preventDefault();
        startTransition(() => {
          void handlePasteClipboardFrame();
        });
        return;
      }

      if (isNodeDuplicateShortcut(event)) {
        event.preventDefault();
        startTransition(() => {
          void handleDuplicateSelectedFrame();
        });
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        startTransition(() => {
          void handleDeleteSelection();
        });
        return;
      }

      if (isNodeLockShortcut(event)) {
        event.preventDefault();
        startTransition(() => {
          void handleToggleSelectedFrameLock();
        });
        return;
      }

      if (isNodeBringForwardShortcut(event)) {
        event.preventDefault();
        startTransition(() => {
          void handleLayerAction("bringForward");
        });
        return;
      }

      if (isNodeSendBackwardShortcut(event)) {
        event.preventDefault();
        startTransition(() => {
          void handleLayerAction("sendBackward");
        });
        return;
      }

      if (event.key === "Enter" && selectedFrame?.type === "TEXT") {
        event.preventDefault();
        setEditingTextFrameId(selectedFrame.id);
        return;
      }

      const nudge = event.shiftKey ? 10 : 1;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        if (!selectedFrame || selectedFrameIds.length > 1 || selectedFrame.locked) return;
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
  }, [
    applySelectedFrameDraftPatch,
    cropModeFrameId,
    editingTextFrameId,
    handleCopySelectedFrame,
    handleDuplicateSelectedFrame,
    handleDeleteSelection,
    handleLayerAction,
    handlePasteClipboardFrame,
    handleToggleSelectedFrameLock,
    selectedFrame,
    selectedFrameId,
    selectedFrameIds,
    startTransition
  ]);

  useEffect(() => {
    if (!userMenuOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!userMenuRef.current) return;
      if (userMenuRef.current.contains(event.target as Node)) return;
      setUserMenuOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setUserMenuOpen(false);
    }

    globalThis.addEventListener("pointerdown", onPointerDown);
    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      globalThis.removeEventListener("pointerdown", onPointerDown);
      globalThis.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  const enterCanvasFullscreen = useCallback(async () => {
    setCanvasOnlyFullscreen(true);
    const target = shellContainerRef.current;
    if (!target) return;
    if (document.fullscreenElement === target) return;
    try {
      await target.requestFullscreen();
    } catch {
      setMessage("Unable to enter browser fullscreen mode.");
    }
  }, []);

  const exitCanvasFullscreen = useCallback(async () => {
    setCanvasOnlyFullscreen(false);
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {
      setMessage("Unable to exit browser fullscreen mode.");
    }
  }, []);

  useEffect(() => {
    if (!canvasOnlyFullscreen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      void exitCanvasFullscreen();
    }

    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
    };
  }, [canvasOnlyFullscreen, exitCanvasFullscreen]);

  useEffect(() => {
    function onFullscreenChange() {
      if (document.fullscreenElement) return;
      setCanvasOnlyFullscreen(false);
    }

    globalThis.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      globalThis.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const canvasStage = (
    <CanvasStage
      page={selectedPage}
      frames={currentFrames}
      selectedFrameId={selectedFrameId}
      selectedFrameIds={selectedFrameIds}
      selectionBounds={selectionBounds}
      zoom={zoom}
      showGrid={showGridOverlay}
      showMarginsOverlay={showMarginsOverlay}
      showSafeAreaOverlay={showSafeAreaOverlay}
      safeAreaPadding={storybookExportSettings.printPreset.safeAreaPadding}
      issueHighlightMessagesByFrameId={currentPageIssueHighlights}
      snapEnabled={snapEnabled}
      editingTextFrameId={editingTextFrameId}
      cropModeFrameId={cropModeFrameId}
      cropDraftByFrameId={cropDraftByFrameId}
      onSelectFrame={handleSelectFrame}
      onStartTextEdit={handleStartTextEdit}
      onEndTextEdit={handleEndTextEdit}
      onTextContentChange={handleTextContentChange}
      onPatchSelectedTextStyle={patchSelectedTextStyle}
      onOpenTextFontPanel={selectedTextFrame ? openTextFontPanel : undefined}
      onOpenTextColorPanel={selectedTextFrame ? openTextColorPanel : undefined}
      onDuplicateSelectedTextFrame={() => void handleDuplicateSelectedTextFrame()}
      onDeleteSelectedTextFrame={() => void handleDeleteSelection()}
      onToggleSelectedFrameLock={() => void handleToggleSelectedFrameLock()}
      onNodeMenuAction={(action) => {
        void handleNodeMenuAction(action);
      }}
      nodeMenuCanPaste={Boolean(getNodeClipboard())}
      nodeMenuCanAlignSelection={selectedFrames.length >= 2 && Boolean(selectionBounds)}
      nodeMenuCanDistribute={isDistributionEligible(selectedFrames)}
      onStartCropEdit={handleStartCropEdit}
      onEndCropEdit={handleApplyCropEdit}
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
      onDropMediaOnFrame={(frameId, payload) => {
        void handleDropMediaOnFrame(frameId, payload);
      }}
      onClearSelection={handleClearSelection}
    />
  );
  const shellClassName = (() => {
    if (canvasOnlyFullscreen) {
      return "fixed inset-0 z-[80] flex h-screen min-h-screen flex-col overflow-hidden bg-[#0a111d]";
    }
    if (fullscreen) {
      return "flex h-screen min-h-screen flex-col overflow-hidden bg-[#0a111d]";
    }
    return "flex h-[calc(100vh-5.5rem)] min-h-[680px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a111d] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";
  })();

  return (
    <div
      ref={shellContainerRef}
      className={shellClassName}
    >
      {canvasOnlyFullscreen ? null : (
        <>
      <div className="relative z-40 border-b border-white/10 px-0 py-0">
        <div className="relative overflow-visible rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] shadow-[0_12px_40px_rgba(4,10,20,0.35)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute left-8 top-0 h-px w-28 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <div className="pointer-events-none absolute -right-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-gold/20 bg-gold/10 blur-xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={`/book/${storybook.id}/chapters`}
                className="rounded-xl border border-white/12 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/[0.06] hover:text-white"
              >
                Back
              </Link>
              <div className="hidden h-7 w-px bg-white/10 sm:block" />
              <Link
                href="/app"
                className="min-w-0 rounded-xl transition hover:bg-white/[0.03]"
              >
                <MemoriosoLogo compact className="origin-left scale-[0.82]" />
              </Link>
              <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/60 md:inline-flex">
                Studio
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Editor2SaveStatus
                status={autosave.status}
                error={autosave.error}
              />
              <ExportButton
                storybookId={storybook.id}
                storybookSettings={storybookExportSettings}
                issueDisplayMeta={issueDisplayMeta}
                onExportSettingsChange={setStorybookExportSettings}
                onIssueNavigate={handleNavigateToExportIssue}
                onIssuesUpdate={setPreflightIssues}
                onOpen={() =>
                  recordStudioMilestone("export_step", "export_click", {
                    flow: "studio_export",
                    storybookId: storybook.id,
                    pageId: effectiveSelectedPageId ?? undefined
                  }, "start")
                }
              />
              <div className="hidden lg:block">
                <PlanStatusBanner compact />
              </div>
              <div ref={userMenuRef} className="relative ml-1">
                <button
                  type="button"
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-xs font-semibold text-white transition hover:bg-white/[0.06]"
                  onClick={() => setUserMenuOpen((current) => !current)}
                >
                  {avatarInitials}
                </button>
                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 overflow-hidden rounded-2xl border border-white/12 bg-[#0b1220]/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl"
                  >
                    <div className="mb-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {userDisplayName || "Memorioso Member"}
                      </p>
                      <p className="truncate text-xs text-white/55">
                        {userEmail ?? "Signed in"}
                      </p>
                    </div>
                    <Link
                      href="/app/profile"
                      role="menuitem"
                      className="flex h-10 items-center rounded-xl px-3 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/app/settings"
                      role="menuitem"
                      className="flex h-10 items-center rounded-xl px-3 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/app/account/billing"
                      role="menuitem"
                      className="flex h-10 items-center rounded-xl px-3 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Billing
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="mt-1 flex h-10 w-full cursor-pointer items-center rounded-xl px-3 text-left text-sm text-rose-100 hover:bg-rose-500/10"
                      onClick={() => {
                        setUserMenuOpen(false);
                        trackAuthLogout({ source: "studio_header_menu" });
                        void signOut({ callbackUrl: "/login?loggedOut=1" });
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {message ? (
        <div className="border-b border-rose-300/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
          {message}
        </div>
      ) : null}
        </>
      )}

      <div className="flex min-h-0 flex-1">
        {canvasOnlyFullscreen ? (
          <div className="relative min-h-0 flex-1">
            {canvasStage}
            <div className="pointer-events-none absolute right-4 top-4 z-20">
              <button
                type="button"
                aria-label="Exit fullscreen canvas"
                title="Exit fullscreen canvas"
                className="pointer-events-auto inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-[#0b1423]/85 text-white shadow-lg backdrop-blur transition hover:bg-[#102039]"
                onClick={() => {
                  void exitCanvasFullscreen();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 4H4v5" />
                  <path d="M15 4h5v5" />
                  <path d="M20 15v5h-5" />
                  <path d="M4 15v5h5" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <StudioShellV2
            rootRef={studioShell.rootRef}
            hoverCapable={studioShell.hoverCapable}
            openPanelId={studioShell.openPanelId}
            pinnedPanelId={studioShell.pinnedPanelId}
            closePanel={studioShell.closePanel}
            pinPanel={studioShell.pinPanel}
            onIconHoverStart={studioShell.onIconHoverStart}
            onIconHoverEnd={studioShell.onIconHoverEnd}
            onPanelHoverStart={studioShell.onPanelHoverStart}
            onPanelHoverEnd={studioShell.onPanelHoverEnd}
            onIconActivate={studioShell.onIconActivate}
            panelContents={studioPanelContents}
            onCanvasPointerDownCapture={studioShell.onCanvasPointerDown}
          >
            <div className="flex h-full min-w-0">
              <div className="relative min-w-0 flex-1">{canvasStage}</div>

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
                onOpenImagePicker={
                  selectedFrame?.type === "IMAGE" || selectedFrame?.type === "FRAME"
                    ? openImagePanel
                    : undefined
                }
                onStartCropMode={
                  selectedCropTargetFrame
                    ? () => handleStartCropEdit(selectedCropTargetFrame.id)
                    : undefined
                }
                onEndCropMode={
                  selectedCropTargetFrame
                    ? () => handleCancelCropEdit(selectedCropTargetFrame.id)
                    : undefined
                }
                cropModeActive={
                  selectedCropTargetFrame
                    ? cropModeFrameId === selectedCropTargetFrame.id
                    : false
                }
              />
            </div>
          </StudioShellV2>
        )}
      </div>

      {canvasOnlyFullscreen ? null : (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0b1320] px-4 py-2 text-xs text-white/55">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <p>WYSIWYG canvas v1</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white/70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="5" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              type="range"
              min={45}
              max={160}
              step={1}
              aria-label="Zoom"
              value={Math.round(zoom * 100)}
              onChange={(event) => setZoom(Number(event.target.value) / 100)}
              className="h-1.5 w-28 cursor-pointer accent-white sm:w-36"
            />
            <span className="min-w-10 text-right font-semibold text-white/85">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <FooterCanvasToggleButton
              label="Overlay Grid"
              active={showGridOverlay}
              onClick={() => setShowGridOverlay((value) => !value)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9.33 4v16" />
                <path d="M14.66 4v16" />
                <path d="M4 9.33h16" />
                <path d="M4 14.66h16" />
              </svg>
            </FooterCanvasToggleButton>
            <FooterCanvasToggleButton
              label="Margins"
              active={showMarginsOverlay}
              onClick={() => setShowMarginsOverlay((value) => !value)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="7.5" y="7.5" width="9" height="9" rx="1" />
              </svg>
            </FooterCanvasToggleButton>
            <FooterCanvasToggleButton
              label="Safe Area"
              active={showSafeAreaOverlay}
              onClick={() => setShowSafeAreaOverlay((value) => !value)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 8h8v8H8z" strokeDasharray="2 2" />
              </svg>
            </FooterCanvasToggleButton>
            <FooterCanvasToggleButton
              label="Snap"
              active={snapEnabled}
              onClick={() => setSnapEnabled((value) => !value)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 4v4" />
                <path d="M12 16v4" />
                <path d="M4 12h4" />
                <path d="M16 12h4" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            </FooterCanvasToggleButton>
            <FooterCanvasToggleButton
              label="Fullscreen Canvas"
              active={canvasOnlyFullscreen}
              onClick={() => {
                void enterCanvasFullscreen();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 4H4v5" />
                <path d="M15 4h5v5" />
                <path d="M20 15v5h-5" />
                <path d="M4 15v5h5" />
              </svg>
            </FooterCanvasToggleButton>
          </div>

          <p className="shrink-0">
            {pages.length} pages ·{" "}
            {Object.values(framesByPageId).reduce(
              (sum, frames) => sum + frames.length,
              0,
            )}{" "}
            frames
            {imagePanelAssetSummary}
          </p>
        </div>
      </div>
      )}

      {isPending ? (
        <div className="pointer-events-none absolute right-4 top-14 rounded-lg border border-white/10 bg-[#0d1626]/90 px-3 py-1 text-xs text-white/80">
          Working...
        </div>
      ) : null}
      <StudioToastsViewport />
    </div>
  );
}
