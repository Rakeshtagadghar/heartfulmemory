"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import {
  buildAdminTemplateLayoutPreview,
  type AdminTemplateBuilderPreviewMode,
  type AdminTemplateBuilderValidationResult,
  type AdminTemplateLayoutBuilderLoadResponse,
  type AdminTemplateLayoutBuilderPreviewResponse,
} from "../../../../packages/shared/admin/templateLayoutBuilder";
import {
  getPageSizePresetConfig,
  pageSizePresets,
} from "../../../../packages/shared-schema/pageFrame.types";
import {
  TEMPLATE_LAYOUT_IMAGE_FITS,
  TEMPLATE_LAYOUT_PAGE_ROLES,
  TEMPLATE_LAYOUT_TEXT_ALIGNMENTS,
  TEMPLATE_LAYOUT_TEXT_OVERFLOW_BEHAVIORS,
  TEMPLATE_PAGE_ORIENTATIONS,
  type TemplateLayoutDefinition,
  type TemplateLayoutSlotDefinition,
  type TemplateLayoutSlotStyle,
  type TemplatePageLayoutDefinition,
} from "../../../../packages/shared/templates/layoutTypes";

type DragState =
  | {
      kind: "move";
      slotId: string;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startX: number;
      startY: number;
    }
  | {
      kind: "resize";
      slotId: string;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startW: number;
      startH: number;
      startAspectRatio: number;
    }
  | null;

const CANVAS_SCALE = 0.48;
const MIN_SLOT_SIZE = 40;
const STYLE_SHADOW_OPTIONS = ["none", "soft"] as const;

function snapToGrid(value: number, gridSize: number) {
  return Math.round(value / gridSize) * gridSize;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snapToCandidates(value: number, candidates: number[], threshold: number) {
  let closest = value;
  let bestDistance = threshold + 1;
  for (const candidate of candidates) {
    const distance = Math.abs(candidate - value);
    if (distance <= threshold && distance < bestDistance) {
      closest = candidate;
      bestDistance = distance;
    }
  }
  return closest;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function cleanStyle(style: TemplateLayoutSlotStyle | undefined) {
  if (!style) return undefined;
  const entries = Object.entries(style).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as TemplateLayoutSlotStyle;
}

function cloneSlot(slot: TemplateLayoutSlotDefinition): TemplateLayoutSlotDefinition {
  return {
    ...slot,
    style: slot.style ? { ...slot.style } : undefined,
    focalPoint: slot.focalPoint ? { ...slot.focalPoint } : undefined,
    allowedContentSources: slot.allowedContentSources ? [...slot.allowedContentSources] : undefined,
  };
}

function cloneLayout(layout: TemplatePageLayoutDefinition): TemplatePageLayoutDefinition {
  return {
    ...layout,
    defaultStyles: layout.defaultStyles ? { ...layout.defaultStyles } : undefined,
    constraints: layout.constraints ? { ...layout.constraints } : undefined,
    slots: layout.slots.map(cloneSlot),
  };
}

function normalizeSlots(slots: TemplateLayoutSlotDefinition[]) {
  return [...slots]
    .sort((left, right) => left.zIndex - right.zIndex)
    .map((slot, index) => ({
      ...slot,
      zIndex: index + 1,
    }));
}

function normalizeLayout(layout: TemplatePageLayoutDefinition): TemplatePageLayoutDefinition {
  return {
    ...layout,
    slots: normalizeSlots(layout.slots),
  };
}

function uniqueSlotId(layout: TemplatePageLayoutDefinition, base: string) {
  let candidate = base;
  let index = 2;
  const slotIds = new Set(layout.slots.map((slot) => slot.slotId));
  while (slotIds.has(candidate)) {
    candidate = `${base}_${index}`;
    index += 1;
  }
  return candidate;
}

function uniqueLayoutId(definition: TemplateLayoutDefinition, base: string) {
  let candidate = base;
  let index = 2;
  const layoutIds = new Set(definition.pageLayouts.map((layout) => layout.pageLayoutId));
  while (layoutIds.has(candidate)) {
    candidate = `${base}_${index}`;
    index += 1;
  }
  return candidate;
}

function defaultSlot(kind: "text" | "image", layout: TemplatePageLayoutDefinition): TemplateLayoutSlotDefinition {
  const baseId = kind === "text" ? "text_slot" : "image_slot";
  const slotId = uniqueSlotId(layout, baseId);
  const offset = layout.slots.length * 16;
  if (kind === "text") {
    return {
      slotId,
      kind,
      role: "body",
      bindingKey: slotId,
      x: 72 + offset,
      y: 72 + offset,
      w: 280,
      h: 140,
      zIndex: layout.slots.length + 1,
      overflowBehavior: "shrink_to_fit",
      alignment: "left",
      editMode: "editable",
      style: cleanStyle({
        color: "#0f172a",
        fontSize: 18,
        lineHeight: 1.4,
      }),
    };
  }
  return {
    slotId,
    kind,
    role: "image",
    bindingKey: slotId,
    x: 96 + offset,
    y: 120 + offset,
    w: 280,
    h: 220,
    zIndex: layout.slots.length + 1,
    imageFit: "cover",
    frameType: "FRAME",
    editMode: "editable",
  };
}

function sanitizeSlotForKind(
  slot: TemplateLayoutSlotDefinition,
  nextKind: "text" | "image"
): TemplateLayoutSlotDefinition {
  if (nextKind === "text") {
    return {
      ...slot,
      kind: "text",
      overflowBehavior: slot.overflowBehavior ?? "shrink_to_fit",
      alignment: slot.alignment ?? "left",
      imageFit: undefined,
      focalPoint: undefined,
      captionSlotId: undefined,
      frameType: undefined,
    };
  }

  return {
    ...slot,
    kind: "image",
    imageFit: slot.imageFit ?? "cover",
    frameType: slot.frameType ?? "FRAME",
    overflowBehavior: undefined,
    maxLines: undefined,
    alignment: undefined,
    minTextLength: undefined,
    maxTextLength: undefined,
  };
}

function buildNewLayout(definition: TemplateLayoutDefinition, baseLayout: TemplatePageLayoutDefinition | null) {
  const seed = baseLayout ? cloneLayout(baseLayout) : null;
  const pageLayoutId = uniqueLayoutId(
    definition,
    seed ? `${seed.pageLayoutId}_variant` : "new_layout"
  );

  if (seed) {
    return {
      ...seed,
      pageLayoutId,
      name: `${seed.name} Copy`,
    } satisfies TemplatePageLayoutDefinition;
  }

  const emptyLayout: TemplatePageLayoutDefinition = {
    pageLayoutId,
    name: "New layout",
    description: "Draft layout",
    pageRole: "story_page",
    sizePreset: "BOOK_8_5X11",
    supportedOrientations: ["portrait"],
    supportsReflowMode: false,
    slots: [],
    defaultStyles: cleanStyle({
      backgroundColor: "#f7f2e8",
    }),
  };
  const titleSlot = defaultSlot("text", emptyLayout);
  const imageSlot = defaultSlot("image", { ...emptyLayout, slots: [titleSlot] });
  return normalizeLayout({
    ...emptyLayout,
    slots: [titleSlot, imageSlot],
  });
}

function findLayoutDeleteBlockers(definition: TemplateLayoutDefinition, pageLayoutId: string) {
  const blockers: string[] = [];
  for (const plan of definition.chapterPagePlans) {
    if (plan.pages.some((page) => page.pageLayoutId === pageLayoutId)) {
      blockers.push(`chapter plan "${plan.chapterKey}"`);
    }
  }
  for (const [role, layoutId] of Object.entries(definition.defaultPageLayoutIdsByRole ?? {})) {
    if (layoutId === pageLayoutId) {
      blockers.push(`default role "${role}"`);
    }
  }
  for (const [layoutId, variants] of Object.entries(definition.orientationVariants ?? {})) {
    if (layoutId === pageLayoutId) {
      blockers.push(`orientation variant source "${layoutId}"`);
    }
    for (const [orientation, targetLayoutId] of Object.entries(variants)) {
      if (targetLayoutId === pageLayoutId) {
        blockers.push(`orientation variant "${layoutId}.${orientation}"`);
      }
    }
  }
  for (const [layoutId, compatibility] of Object.entries(definition.layoutCompatibility ?? {})) {
    if (layoutId === pageLayoutId) {
      blockers.push(`compatibility record "${layoutId}"`);
    }
    if (compatibility.compatibleLayoutIds?.includes(pageLayoutId)) {
      blockers.push(`compatibility target "${layoutId}"`);
    }
  }
  return blockers;
}

function reorderSlots(
  slots: TemplateLayoutSlotDefinition[],
  slotId: string,
  action: "forward" | "backward" | "front" | "back"
) {
  const ordered = [...slots].sort((left, right) => left.zIndex - right.zIndex);
  const index = ordered.findIndex((slot) => slot.slotId === slotId);
  if (index === -1) return normalizeSlots(ordered);

  const [slot] = ordered.splice(index, 1);
  let nextIndex = index;
  if (action === "forward") nextIndex = Math.min(ordered.length, index + 1);
  if (action === "backward") nextIndex = Math.max(0, index - 1);
  if (action === "front") nextIndex = ordered.length;
  if (action === "back") nextIndex = 0;
  ordered.splice(nextIndex, 0, slot);
  return normalizeSlots(ordered);
}

function computeMovePosition(
  layout: TemplatePageLayoutDefinition,
  slot: TemplateLayoutSlotDefinition,
  x: number,
  y: number,
  gridSize: number
) {
  const page = getPageSizePresetConfig(layout.sizePreset);
  const threshold = gridSize * 2;
  const maxX = Math.max(0, page.widthPx - slot.w);
  const maxY = Math.max(0, page.heightPx - slot.h);

  let nextX = clamp(snapToGrid(x, gridSize), 0, maxX);
  let nextY = clamp(snapToGrid(y, gridSize), 0, maxY);

  nextX = snapToCandidates(
    nextX,
    [0, page.defaultMargins.left, page.widthPx - page.defaultMargins.right - slot.w, page.widthPx / 2 - slot.w / 2],
    threshold
  );
  nextY = snapToCandidates(
    nextY,
    [0, page.defaultMargins.top, page.heightPx - page.defaultMargins.bottom - slot.h, page.heightPx / 2 - slot.h / 2],
    threshold
  );

  return {
    x: clamp(nextX, 0, maxX),
    y: clamp(nextY, 0, maxY),
  };
}

function computeResizeSize(
  layout: TemplatePageLayoutDefinition,
  slot: TemplateLayoutSlotDefinition,
  w: number,
  h: number,
  gridSize: number
) {
  const page = getPageSizePresetConfig(layout.sizePreset);
  const threshold = gridSize * 2;
  const maxW = Math.max(MIN_SLOT_SIZE, page.widthPx - slot.x);
  const maxH = Math.max(MIN_SLOT_SIZE, page.heightPx - slot.y);

  let nextW = clamp(snapToGrid(w, gridSize), MIN_SLOT_SIZE, maxW);
  let nextH = clamp(snapToGrid(h, gridSize), MIN_SLOT_SIZE, maxH);

  const snappedRight = snapToCandidates(
    slot.x + nextW,
    [page.widthPx / 2, page.widthPx - page.defaultMargins.right, page.widthPx],
    threshold
  );
  const snappedBottom = snapToCandidates(
    slot.y + nextH,
    [page.heightPx / 2, page.heightPx - page.defaultMargins.bottom, page.heightPx],
    threshold
  );

  nextW = clamp(snappedRight - slot.x, MIN_SLOT_SIZE, maxW);
  nextH = clamp(snappedBottom - slot.y, MIN_SLOT_SIZE, maxH);

  return { w: nextW, h: nextH };
}

function formatPublishedRef(value: string | null) {
  return value ?? "No published template snapshot tracked yet";
}

function PreviewCanvas({
  layout,
  preview,
  selectedSlotId,
  canManage,
  onSelectSlot,
  onPointerStart,
}: {
  layout: TemplatePageLayoutDefinition;
  preview: AdminTemplateLayoutBuilderPreviewResponse;
  selectedSlotId: string | null;
  canManage: boolean;
  onSelectSlot: (slotId: string) => void;
  onPointerStart: (
    event: React.PointerEvent<HTMLButtonElement>,
    slotId: string,
    kind: "move" | "resize"
  ) => void;
}) {
  const pageConfig = getPageSizePresetConfig(layout.sizePreset);
  const previewData = preview.renderedPreviewRefOrData;
  const backgroundFill = previewData?.backgroundFill ?? "#f7f2e8";

  return (
    <div className="overflow-auto rounded-2xl border border-white/10 bg-[#07111d] p-4">
      <div
        className="relative mx-auto"
        style={{ width: pageConfig.widthPx * CANVAS_SCALE, height: pageConfig.heightPx * CANVAS_SCALE }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-[20px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          style={{
            width: pageConfig.widthPx,
            height: pageConfig.heightPx,
            transform: `scale(${CANVAS_SCALE})`,
            backgroundColor: backgroundFill,
          }}
        >
          <div className="absolute inset-0 opacity-100">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(30,41,59,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,41,59,0.08) 1px, transparent 1px)",
                backgroundSize: "4px 4px",
              }}
            />
            <div
              className="absolute border border-dashed border-emerald-500/40"
              style={{
                left: pageConfig.defaultMargins.left,
                top: pageConfig.defaultMargins.top,
                width: pageConfig.widthPx - pageConfig.defaultMargins.left - pageConfig.defaultMargins.right,
                height: pageConfig.heightPx - pageConfig.defaultMargins.top - pageConfig.defaultMargins.bottom,
              }}
            />
            <div
              className="absolute top-0 h-full border-l border-dashed border-sky-500/25"
              style={{ left: pageConfig.widthPx / 2 }}
            />
            <div
              className="absolute left-0 w-full border-t border-dashed border-sky-500/25"
              style={{ top: pageConfig.heightPx / 2 }}
            />
          </div>

          {(previewData?.items ?? []).map((item) => (
            <button
              key={item.slotId}
              type="button"
              aria-label={`Select ${item.kind} slot ${item.slotId}`}
              className={classNames(
                "absolute overflow-hidden rounded-lg border text-left transition",
                selectedSlotId === item.slotId
                  ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.6)]"
                  : "border-slate-400/40",
                item.kind === "text"
                  ? "bg-white/85 text-slate-900"
                  : "bg-slate-200 text-slate-700"
              )}
              style={{ left: item.x, top: item.y, width: item.w, height: item.h, zIndex: item.zIndex }}
              onClick={() => onSelectSlot(item.slotId)}
              onPointerDown={(event) => {
                if (!canManage) return;
                onPointerStart(event, item.slotId, "move");
              }}
            >
              <div className="absolute left-2 top-2 flex gap-1">
                {item.required ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-amber-800">
                    Required
                  </span>
                ) : null}
                {item.locked ? (
                  <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-700">
                    Locked
                  </span>
                ) : null}
              </div>
              {item.kind === "image" ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#dbeafe,#cbd5e1)] px-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                  <span>{item.label}</span>
                  <span className="mt-2 text-[10px] tracking-[0.14em] text-slate-500">
                    {item.imageFit ?? "cover"}
                    {item.captionSlotId ? ` | caption ${item.captionSlotId}` : ""}
                  </span>
                </div>
              ) : (
                <div className="flex h-full flex-col p-3">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{item.label}</span>
                  <span
                    className="mt-2 text-sm"
                    style={{
                      textAlign: item.alignment as "left" | "center" | "right" | undefined,
                      display: "-webkit-box",
                      WebkitLineClamp: item.maxLines ?? 6,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              )}
              {canManage ? (
                <span
                  role="presentation"
                  className="absolute bottom-1 right-1 h-3 w-3 cursor-se-resize rounded-sm bg-emerald-500"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onPointerStart(
                      event as unknown as React.PointerEvent<HTMLButtonElement>,
                      item.slotId,
                      "resize"
                    );
                  }}
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TemplateLayoutBuilderShell({
  initialData,
  initialPreview,
}: {
  initialData: AdminTemplateLayoutBuilderLoadResponse;
  initialPreview: AdminTemplateLayoutBuilderPreviewResponse;
}) {
  const [layoutDefinition, setLayoutDefinition] = useState(initialData.layoutDefinition);
  const [selectedLayoutId, setSelectedLayoutId] = useState(initialData.selectedLayoutId);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    initialData.selectedLayout?.slots[0]?.slotId ?? null
  );
  const [validation, setValidation] = useState<AdminTemplateBuilderValidationResult>(initialData.validation);
  const [serverPreview, setServerPreview] = useState(initialPreview);
  const [previewMode, setPreviewMode] = useState<AdminTemplateBuilderPreviewMode>(initialPreview.previewMode);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(initialData.draftState.lastSavedAt);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "validating" | "previewing">("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const dragStateRef = useRef<DragState>(null);

  const canManage = initialData.canManage;
  const layoutSummaries = layoutDefinition.pageLayouts.map((layout) => ({
    pageLayoutId: layout.pageLayoutId,
    name: layout.name,
    description: layout.description ?? null,
    pageRole: layout.pageRole ?? null,
    sizePreset: layout.sizePreset,
    slotCount: layout.slots.length,
    supportedOrientations: layout.supportedOrientations,
    supportsReflowMode: Boolean(layout.supportsReflowMode),
  }));
  const selectedLayout =
    layoutDefinition.pageLayouts.find((layout) => layout.pageLayoutId === selectedLayoutId) ?? null;
  const selectedSlot =
    selectedLayout?.slots.find((slot) => slot.slotId === selectedSlotId) ?? null;
  const livePreview = selectedLayout
    ? buildAdminTemplateLayoutPreview(layoutDefinition, selectedLayout.pageLayoutId, previewMode)
    : serverPreview;
  const selectedLayoutDeleteBlockers = selectedLayout
    ? findLayoutDeleteBlockers(layoutDefinition, selectedLayout.pageLayoutId)
    : [];

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!selectedLayout) {
      setSelectedSlotId(null);
      return;
    }
    if (selectedSlotId && selectedLayout.slots.some((slot) => slot.slotId === selectedSlotId)) {
      return;
    }
    setSelectedSlotId(selectedLayout.slots[0]?.slotId ?? null);
  }, [selectedLayout, selectedSlotId]);

  function patchLayoutById(
    pageLayoutId: string,
    mutator: (layout: TemplatePageLayoutDefinition) => TemplatePageLayoutDefinition
  ) {
    setLayoutDefinition((current) => ({
      ...current,
      pageLayouts: current.pageLayouts.map((layout) =>
        layout.pageLayoutId === pageLayoutId ? normalizeLayout(mutator(layout)) : layout
      ),
    }));
    setDirty(true);
    setNotice(null);
  }

  function patchSelectedLayout(mutator: (layout: TemplatePageLayoutDefinition) => TemplatePageLayoutDefinition) {
    if (!selectedLayout) return;
    patchLayoutById(selectedLayout.pageLayoutId, mutator);
  }

  function patchSlotById(
    slotId: string,
    mutator: (slot: TemplateLayoutSlotDefinition) => TemplateLayoutSlotDefinition
  ) {
    if (!selectedLayout) return;
    patchSelectedLayout((layout) => ({
      ...layout,
      slots: layout.slots.map((slot) => (slot.slotId === slotId ? mutator(slot) : slot)),
    }));
  }

  function patchSelectedSlot(mutator: (slot: TemplateLayoutSlotDefinition) => TemplateLayoutSlotDefinition) {
    if (!selectedSlotId) return;
    patchSlotById(selectedSlotId, mutator);
  }

  function patchSelectedSlotStyle(
    mutator: (style: TemplateLayoutSlotStyle) => TemplateLayoutSlotStyle
  ) {
    patchSelectedSlot((slot) => ({
      ...slot,
      style: cleanStyle(mutator({ ...(slot.style ?? {}) })),
    }));
  }

  function renameSelectedSlot(nextSlotId: string) {
    if (!selectedLayout || !selectedSlot) return;
    patchSelectedLayout((layout) => ({
      ...layout,
      slots: layout.slots.map((slot) => {
        if (slot.slotId === selectedSlot.slotId) {
          return { ...slot, slotId: nextSlotId };
        }
        if (slot.captionSlotId === selectedSlot.slotId) {
          return { ...slot, captionSlotId: nextSlotId || undefined };
        }
        return slot;
      }),
    }));
    setSelectedSlotId(nextSlotId || null);
  }

  function createLayout() {
    if (!canManage) return;
    const nextLayout = buildNewLayout(layoutDefinition, null);
    setLayoutDefinition((current) => ({
      ...current,
      pageLayouts: [...current.pageLayouts, nextLayout],
    }));
    setSelectedLayoutId(nextLayout.pageLayoutId);
    setSelectedSlotId(nextLayout.slots[0]?.slotId ?? null);
    setDirty(true);
    setNotice(`Created layout "${nextLayout.name}".`);
  }

  function duplicateSelectedLayout() {
    if (!canManage || !selectedLayout) return;
    const nextLayout = buildNewLayout(layoutDefinition, selectedLayout);
    setLayoutDefinition((current) => ({
      ...current,
      pageLayouts: [...current.pageLayouts, nextLayout],
    }));
    setSelectedLayoutId(nextLayout.pageLayoutId);
    setSelectedSlotId(nextLayout.slots[0]?.slotId ?? null);
    setDirty(true);
    setNotice(`Duplicated layout "${selectedLayout.name}".`);
  }

  function deleteSelectedLayout() {
    if (!canManage || !selectedLayout) return;
    if (layoutDefinition.pageLayouts.length <= 1) {
      setNotice("At least one layout must remain in the template.");
      return;
    }
    if (selectedLayoutDeleteBlockers.length > 0) {
      setNotice(
        `Layout "${selectedLayout.name}" is still referenced by ${selectedLayoutDeleteBlockers.join(", ")}.`
      );
      return;
    }

    const remainingLayouts = layoutDefinition.pageLayouts.filter(
      (layout) => layout.pageLayoutId !== selectedLayout.pageLayoutId
    );
    setLayoutDefinition((current) => ({
      ...current,
      pageLayouts: remainingLayouts,
    }));
    setSelectedLayoutId(remainingLayouts[0]?.pageLayoutId ?? null);
    setSelectedSlotId(remainingLayouts[0]?.slots[0]?.slotId ?? null);
    setDirty(true);
    setNotice(`Deleted layout "${selectedLayout.name}".`);
  }

  function addSlot(kind: "text" | "image") {
    if (!canManage || !selectedLayout) return;
    const slot = defaultSlot(kind, selectedLayout);
    patchSelectedLayout((layout) => ({
      ...layout,
      slots: [...layout.slots, slot],
    }));
    setSelectedSlotId(slot.slotId);
  }

  function duplicateSelectedSlot() {
    if (!canManage || !selectedLayout || !selectedSlot) return;
    const duplicateId = uniqueSlotId(selectedLayout, `${selectedSlot.slotId}_copy`);
    patchSelectedLayout((layout) => ({
      ...layout,
      slots: [
        ...layout.slots,
        {
          ...cloneSlot(selectedSlot),
          slotId: duplicateId,
          bindingKey: selectedSlot.bindingKey ? `${selectedSlot.bindingKey}_copy` : undefined,
          x: snapToGrid(selectedSlot.x + 16, initialData.builderConfig.gridSize),
          y: snapToGrid(selectedSlot.y + 16, initialData.builderConfig.gridSize),
          zIndex: layout.slots.length + 1,
        },
      ],
    }));
    setSelectedSlotId(duplicateId);
  }

  function deleteSelectedSlot() {
    if (!canManage || !selectedLayout || !selectedSlot) return;
    patchSelectedLayout((layout) => ({
      ...layout,
      slots: layout.slots
        .filter((slot) => slot.slotId !== selectedSlot.slotId)
        .map((slot) =>
          slot.captionSlotId === selectedSlot.slotId ? { ...slot, captionSlotId: undefined } : slot
        ),
    }));
    setSelectedSlotId(selectedLayout.slots.find((slot) => slot.slotId !== selectedSlot.slotId)?.slotId ?? null);
  }

  function moveSlotZ(action: "forward" | "backward" | "front" | "back") {
    if (!canManage || !selectedLayout || !selectedSlot) return;
    patchSelectedLayout((layout) => ({
      ...layout,
      slots: reorderSlots(layout.slots, selectedSlot.slotId, action),
    }));
  }

  function beginPointerGesture(
    event: React.PointerEvent<HTMLButtonElement>,
    slotId: string,
    kind: "move" | "resize"
  ) {
    if (!canManage || !selectedLayout) return;
    const slot = selectedLayout.slots.find((item) => item.slotId === slotId);
    if (!slot || slot.locked) return;
    setSelectedSlotId(slotId);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current =
      kind === "move"
        ? {
            kind,
            slotId,
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: slot.x,
            startY: slot.y,
          }
        : {
            kind,
            slotId,
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startW: slot.w,
            startH: slot.h,
            startAspectRatio: slot.w / slot.h,
          };
  }

  function onCanvasPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || !selectedLayout) return;
    const slot = selectedLayout.slots.find((item) => item.slotId === dragState.slotId);
    if (!slot || slot.locked) return;

    const dx = (event.clientX - dragState.startClientX) / CANVAS_SCALE;
    const dy = (event.clientY - dragState.startClientY) / CANVAS_SCALE;

    if (dragState.kind === "move") {
      const next = computeMovePosition(
        selectedLayout,
        slot,
        dragState.startX + dx,
        dragState.startY + dy,
        initialData.builderConfig.gridSize
      );
      patchSlotById(dragState.slotId, (current) => ({
        ...current,
        x: next.x,
        y: next.y,
      }));
      return;
    }

    let nextW = dragState.startW + dx;
    let nextH = dragState.startH + dy;
    if (slot.kind === "image" && event.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        nextH = nextW / dragState.startAspectRatio;
      } else {
        nextW = nextH * dragState.startAspectRatio;
      }
    }

    const next = computeResizeSize(
      selectedLayout,
      slot,
      nextW,
      nextH,
      initialData.builderConfig.gridSize
    );

    patchSlotById(dragState.slotId, (current) => ({
      ...current,
      w: next.w,
      h: next.h,
    }));
  }

  function endCanvasPointerGesture() {
    dragStateRef.current = null;
  }

  async function saveDraft() {
    if (!canManage) return;
    setSaveState("saving");
    setNotice(null);
    const response = await fetch(`/api/admin/templates/${encodeURIComponent(initialData.templateId)}/layout-builder`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ layoutDefinition, selectedLayoutId }),
    });
    const body = (await response.json()) as {
      success: boolean;
      data?: AdminTemplateLayoutBuilderLoadResponse;
      error?: { message: string };
    };
    startTransition(() => {
      setSaveState("idle");
      if (!response.ok || !body.success || !body.data) {
        setNotice(body.error?.message ?? "Builder draft could not be saved.");
        return;
      }
      setLayoutDefinition(body.data.layoutDefinition);
      setValidation(body.data.validation);
      setDirty(false);
      setLastSavedAt(body.data.draftState.lastSavedAt);
      setSelectedLayoutId(body.data.selectedLayoutId ?? selectedLayoutId);
      setNotice("Draft saved.");
    });
  }

  async function validateDraft() {
    if (!canManage) return;
    setSaveState("validating");
    setNotice(null);
    const response = await fetch(`/api/admin/templates/${encodeURIComponent(initialData.templateId)}/layout-builder/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ layoutDefinition }),
    });
    const body = (await response.json()) as {
      success: boolean;
      data?: AdminTemplateBuilderValidationResult;
      error?: { message: string };
    };
    startTransition(() => {
      setSaveState("idle");
      if (!response.ok || !body.success || !body.data) {
        setNotice(body.error?.message ?? "Builder validation failed.");
        return;
      }
      setValidation(body.data);
      setNotice(body.data.isValid ? "Validation passed." : "Validation found issues.");
    });
  }

  async function refreshServerPreview() {
    if (!selectedLayout) return;
    setSaveState("previewing");
    setNotice(null);
    const response = await fetch(`/api/admin/templates/${encodeURIComponent(initialData.templateId)}/layout-builder/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        layoutDefinition,
        pageLayoutId: selectedLayout.pageLayoutId,
        previewMode,
      }),
    });
    const body = (await response.json()) as {
      success: boolean;
      data?: AdminTemplateLayoutBuilderPreviewResponse;
      error?: { message: string };
    };
    startTransition(() => {
      setSaveState("idle");
      if (!response.ok || !body.success || !body.data) {
        setNotice(body.error?.message ?? "Server preview failed.");
        return;
      }
      setServerPreview(body.data);
      setNotice("Server preview refreshed.");
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/35">Template layout builder</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{initialData.templateName}</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/55">
              Draft-only visual authoring for canonical page layouts with exact XY coordinates, layout metadata,
              and live preview.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/65">
              {initialData.templateStatus}
            </span>
            <span
              className={classNames(
                "rounded-full px-3 py-1 text-xs",
                canManage ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-100"
              )}
            >
              {canManage ? "Editable draft" : "Read-only review"}
            </span>
            <button
              type="button"
              onClick={() => void refreshServerPreview()}
              className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14]"
            >
              Refresh preview
            </button>
            {canManage ? (
              <>
                <button
                  type="button"
                  onClick={() => void validateDraft()}
                  className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14]"
                >
                  Validate
                </button>
                <button
                  type="button"
                  onClick={() => void saveDraft()}
                  className="rounded-lg bg-emerald-500/80 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
                >
                  Save draft
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Draft state</p>
            <p className="mt-2 text-sm font-medium text-white">
              {dirty ? "Unsaved changes" : "Draft matches latest save"}
            </p>
            <p className="mt-2 text-xs text-white/45">
              Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString("en-GB") : "Never"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Published boundary</p>
            <p className="mt-2 text-sm font-medium text-white">
              {initialData.templateStatus === "published"
                ? "Current published template remains unchanged"
                : "This template is still draft-only"}
            </p>
            <p className="mt-2 break-all text-xs text-white/45">
              {formatPublishedRef(initialData.draftState.publishedVersionRef)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Builder status</p>
            <p className="mt-2 text-sm font-medium text-white">
              Grid {initialData.builderConfig.gridSize}px
              {saveState !== "idle" ? ` | ${saveState}...` : ""}
            </p>
            <p className="mt-2 text-xs text-white/45">
              {notice ?? "Hold Shift while resizing an image slot to preserve aspect ratio."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-white/75">Layouts</h2>
              {canManage ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={createLayout}
                    className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-white"
                  >
                    New layout
                  </button>
                  <button
                    type="button"
                    onClick={duplicateSelectedLayout}
                    disabled={!selectedLayout}
                    className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-white disabled:opacity-40"
                  >
                    Duplicate
                  </button>
                </div>
              ) : null}
            </div>
            <div className="mt-3 space-y-2">
              {layoutSummaries.map((layout) => (
                <button
                  key={layout.pageLayoutId}
                  type="button"
                  onClick={() => setSelectedLayoutId(layout.pageLayoutId)}
                  className={classNames(
                    "w-full rounded-xl border px-3 py-3 text-left transition",
                    layout.pageLayoutId === selectedLayoutId
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{layout.name}</p>
                      <p className="mt-1 text-xs text-white/45">{layout.pageLayoutId}</p>
                    </div>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/55">
                      {layout.sizePreset}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/35">
                    {layout.pageRole ?? "no role"} | {layout.slotCount} slots |{" "}
                    {layout.supportedOrientations.join(", ")}
                  </p>
                  {layout.supportsReflowMode ? (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-emerald-200/70">
                      Reflow enabled
                    </p>
                  ) : null}
                  {layout.description ? <p className="mt-2 text-xs text-white/45">{layout.description}</p> : null}
                </button>
              ))}
            </div>
            {canManage ? (
              <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-white/45">
                Deleting a layout is blocked while chapter plans, default role bindings, or compatibility records still
                reference it.
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white/75">Layers</h2>
              {canManage ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addSlot("text")}
                    className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-white"
                  >
                    + Text
                  </button>
                  <button
                    type="button"
                    onClick={() => addSlot("image")}
                    className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-white"
                  >
                    + Image
                  </button>
                </div>
              ) : null}
            </div>
            <div className="mt-3 space-y-2">
              {selectedLayout?.slots
                .slice()
                .sort((left, right) => right.zIndex - left.zIndex)
                .map((slot) => (
                  <button
                    key={slot.slotId}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.slotId)}
                    className={classNames(
                      "w-full rounded-xl border px-3 py-2 text-left",
                      slot.slotId === selectedSlotId
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-white/8 bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-white">{slot.slotId}</span>
                      <span className="text-[11px] uppercase tracking-[0.12em] text-white/40">{slot.kind}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/35">
                      z{slot.zIndex} | {slot.bindingKey ?? "no bindingKey"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45">
                      {slot.locked ? <span>locked</span> : null}
                      {slot.required ? <span>required</span> : null}
                      {slot.captionSlotId ? <span>caption {slot.captionSlotId}</span> : null}
                    </div>
                  </button>
                ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-medium text-white/75">Validation</h2>
            <div className="mt-3 space-y-3">
              <div
                className={classNames(
                  "rounded-xl border px-3 py-3 text-sm",
                  validation.isValid
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-50"
                )}
              >
                {validation.isValid
                  ? "Builder validation passed."
                  : `${validation.errors.length} validation error(s) need attention.`}
              </div>
              {validation.errors.map((issue) => (
                <div
                  key={`${issue.code}:${issue.path}`}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-100"
                >
                  <p className="font-medium">{issue.code}</p>
                  <p className="mt-1">{issue.message}</p>
                  <p className="mt-1 text-rose-100/60">{issue.path}</p>
                </div>
              ))}
              {validation.warnings.map((issue) => (
                <div
                  key={`${issue.code}:${issue.path}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/65"
                >
                  <p className="font-medium text-white/80">{issue.code}</p>
                  <p className="mt-1">{issue.message}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white/75">Layout properties</h2>
              {canManage ? (
                <button
                  type="button"
                  onClick={deleteSelectedLayout}
                  disabled={!selectedLayout}
                  className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-100 disabled:opacity-40"
                >
                  Delete layout
                </button>
              ) : null}
            </div>
            {selectedLayout ? (
              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs text-white/45">
                    Layout id
                    <input
                      value={selectedLayout.pageLayoutId}
                      readOnly
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white/70"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/45">
                    Page type
                    <input
                      value={selectedLayout.pageType ?? ""}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedLayout((layout) => ({
                          ...layout,
                          pageType: event.target.value || undefined,
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    />
                  </label>
                </div>
                <label className="grid gap-1 text-xs text-white/45">
                  Name
                  <input
                    value={selectedLayout.name}
                    disabled={!canManage}
                    onChange={(event) => patchSelectedLayout((layout) => ({ ...layout, name: event.target.value }))}
                    className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                  />
                </label>
                <label className="grid gap-1 text-xs text-white/45">
                  Description
                  <textarea
                    value={selectedLayout.description ?? ""}
                    disabled={!canManage}
                    onChange={(event) =>
                      patchSelectedLayout((layout) => ({
                        ...layout,
                        description: event.target.value || undefined,
                      }))
                    }
                    className="min-h-20 rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs text-white/45">
                    Page role
                    <select
                      value={selectedLayout.pageRole ?? ""}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedLayout((layout) => ({
                          ...layout,
                          pageRole: event.target.value
                            ? (event.target.value as TemplatePageLayoutDefinition["pageRole"])
                            : undefined,
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    >
                      <option value="">none</option>
                      {TEMPLATE_LAYOUT_PAGE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs text-white/45">
                    Size preset
                    <select
                      value={selectedLayout.sizePreset}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedLayout((layout) => ({
                          ...layout,
                          sizePreset: event.target.value as TemplatePageLayoutDefinition["sizePreset"],
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    >
                      {pageSizePresets.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-2 text-xs text-white/45">
                  <span>Supported orientations</span>
                  <div className="flex flex-wrap gap-3">
                    {TEMPLATE_PAGE_ORIENTATIONS.map((orientation) => {
                      const checked = selectedLayout.supportedOrientations.includes(orientation);
                      return (
                        <label key={orientation} className="inline-flex items-center gap-2 text-sm text-white/70">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canManage}
                            onChange={(event) => {
                              if (!canManage) return;
                              const nextOrientations = event.target.checked
                                ? [...selectedLayout.supportedOrientations, orientation]
                                : selectedLayout.supportedOrientations.filter((item) => item !== orientation);
                              if (nextOrientations.length === 0) {
                                setNotice("Each layout must support at least one orientation.");
                                return;
                              }
                              patchSelectedLayout((layout) => ({
                                ...layout,
                                supportedOrientations: nextOrientations,
                              }));
                            }}
                          />
                          {orientation}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedLayout.supportsReflowMode)}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedLayout((layout) => ({
                          ...layout,
                          supportsReflowMode: event.target.checked || undefined,
                        }))
                      }
                    />
                    Supports reflow mode
                  </label>
                  <label className="grid gap-1 text-xs text-white/45">
                    Preview thumbnail URL
                    <input
                      value={selectedLayout.previewThumbnailUrl ?? ""}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedLayout((layout) => ({
                          ...layout,
                          previewThumbnailUrl: event.target.value || undefined,
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    />
                  </label>
                </div>
                <label className="grid gap-1 text-xs text-white/45">
                  Layout background
                  <input
                    value={selectedLayout.defaultStyles?.backgroundColor ?? ""}
                    disabled={!canManage}
                    onChange={(event) =>
                      patchSelectedLayout((layout) => ({
                        ...layout,
                        defaultStyles: cleanStyle({
                          ...(layout.defaultStyles ?? {}),
                          backgroundColor: event.target.value || undefined,
                          fill: event.target.value || layout.defaultStyles?.fill,
                        }),
                      }))
                    }
                    placeholder="#f7f2e8"
                    className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                  />
                </label>
                {selectedLayoutDeleteBlockers.length > 0 ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
                    Delete is currently blocked by {selectedLayoutDeleteBlockers.join(", ")}.
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white/75">Slot properties</h2>
              {canManage && selectedSlot ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={duplicateSelectedSlot}
                    className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-white"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelectedSlot}
                    className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-100"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
            {selectedSlot ? (
              <div className="mt-4 grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs text-white/45">
                    Slot id
                    <input
                      value={selectedSlot.slotId}
                      disabled={!canManage}
                      onChange={(event) => renameSelectedSlot(event.target.value)}
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/45">
                    Binding key
                    <input
                      value={selectedSlot.bindingKey ?? ""}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedSlot((slot) => ({
                          ...slot,
                          bindingKey: event.target.value || undefined,
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="grid gap-1 text-xs text-white/45">
                    Kind
                    <select
                      value={selectedSlot.kind}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedSlot((slot) =>
                          sanitizeSlotForKind(slot, event.target.value as "text" | "image")
                        )
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    >
                      <option value="text">text</option>
                      <option value="image">image</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs text-white/45">
                    Role
                    <input
                      value={selectedSlot.role ?? ""}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedSlot((slot) => ({
                          ...slot,
                          role: event.target.value || undefined,
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/45">
                    Edit mode
                    <select
                      value={selectedSlot.editMode ?? "editable"}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedSlot((slot) => ({
                          ...slot,
                          editMode: event.target.value as TemplateLayoutSlotDefinition["editMode"],
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    >
                      <option value="editable">editable</option>
                      <option value="populate_only">populate_only</option>
                      <option value="readonly_decorative">readonly_decorative</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {(["x", "y", "w", "h"] as const).map((field) => (
                    <label key={field} className="grid gap-1 text-xs text-white/45">
                      {field.toUpperCase()}
                      <input
                        type="number"
                        value={selectedSlot[field]}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlot((slot) => ({
                            ...slot,
                            [field]: Math.max(
                              field === "w" || field === "h" ? MIN_SLOT_SIZE : 0,
                              Number(event.target.value) || 0
                            ),
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                  ))}
                  <label className="grid gap-1 text-xs text-white/45">
                    Z-index
                    <input
                      type="number"
                      value={selectedSlot.zIndex}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedSlot((slot) => ({
                          ...slot,
                          zIndex: Math.max(0, Number(event.target.value) || 0),
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedSlot.locked)}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedSlot((slot) => ({
                          ...slot,
                          locked: event.target.checked || undefined,
                        }))
                      }
                    />
                    Locked
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedSlot.required)}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedSlot((slot) => ({
                          ...slot,
                          required: event.target.checked || undefined,
                        }))
                      }
                    />
                    Required
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs text-white/45">
                    Style token ref
                    <input
                      value={selectedSlot.styleTokenRef ?? ""}
                      disabled={!canManage}
                      onChange={(event) =>
                        patchSelectedSlot((slot) => ({
                          ...slot,
                          styleTokenRef: event.target.value || undefined,
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                    />
                  </label>
                  {selectedSlot.kind === "image" ? (
                    <label className="grid gap-1 text-xs text-white/45">
                      Caption slot
                      <select
                        value={selectedSlot.captionSlotId ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlot((slot) => ({
                            ...slot,
                            captionSlotId: event.target.value || undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      >
                        <option value="">none</option>
                        {selectedLayout?.slots
                          .filter((slot) => slot.kind === "text")
                          .map((slot) => (
                            <option key={slot.slotId} value={slot.slotId}>
                              {slot.slotId}
                            </option>
                          ))}
                      </select>
                    </label>
                  ) : (
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-white/45">
                      Caption links are only available on image slots.
                    </div>
                  )}
                </div>

                {selectedSlot.kind === "text" ? (
                  <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/35">Text controls</p>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="grid gap-1 text-xs text-white/45">
                        Alignment
                        <select
                          value={selectedSlot.alignment ?? "left"}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              alignment: event.target.value as TemplateLayoutSlotDefinition["alignment"],
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        >
                          {TEMPLATE_LAYOUT_TEXT_ALIGNMENTS.map((alignment) => (
                            <option key={alignment} value={alignment}>
                              {alignment}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs text-white/45">
                        Max lines
                        <input
                          type="number"
                          value={selectedSlot.maxLines ?? ""}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              maxLines: event.target.value
                                ? Math.max(1, Number(event.target.value) || 1)
                                : undefined,
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-white/45">
                        Overflow
                        <select
                          value={selectedSlot.overflowBehavior ?? "shrink_to_fit"}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              overflowBehavior:
                                event.target.value as TemplateLayoutSlotDefinition["overflowBehavior"],
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        >
                          {TEMPLATE_LAYOUT_TEXT_OVERFLOW_BEHAVIORS.map((behavior) => (
                            <option key={behavior} value={behavior}>
                              {behavior}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-xs text-white/45">
                        Min text length
                        <input
                          type="number"
                          value={selectedSlot.minTextLength ?? ""}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              minTextLength: event.target.value
                                ? Math.max(0, Number(event.target.value) || 0)
                                : undefined,
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-white/45">
                        Max text length
                        <input
                          type="number"
                          value={selectedSlot.maxTextLength ?? ""}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              maxTextLength: event.target.value
                                ? Math.max(0, Number(event.target.value) || 0)
                                : undefined,
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                {selectedSlot.kind === "image" ? (
                  <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/35">Image controls</p>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="grid gap-1 text-xs text-white/45">
                        Fit
                        <select
                          value={selectedSlot.imageFit ?? "cover"}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              imageFit: event.target.value as TemplateLayoutSlotDefinition["imageFit"],
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        >
                          {TEMPLATE_LAYOUT_IMAGE_FITS.map((fit) => (
                            <option key={fit} value={fit}>
                              {fit}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs text-white/45">
                        Frame type
                        <select
                          value={selectedSlot.frameType ?? "FRAME"}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              frameType: event.target.value as TemplateLayoutSlotDefinition["frameType"],
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        >
                          <option value="FRAME">FRAME</option>
                          <option value="IMAGE">IMAGE</option>
                        </select>
                      </label>
                      <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-white/45">
                        Hold Shift during resize to preserve aspect ratio.
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-xs text-white/45">
                        Focal point X
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step="0.01"
                          value={selectedSlot.focalPoint?.x ?? ""}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              focalPoint: event.target.value || slot.focalPoint?.y !== undefined
                                ? {
                                    x: event.target.value ? clamp(Number(event.target.value) || 0, 0, 1) : 0,
                                    y: slot.focalPoint?.y ?? 0.5,
                                  }
                                : undefined,
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-white/45">
                        Focal point Y
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step="0.01"
                          value={selectedSlot.focalPoint?.y ?? ""}
                          disabled={!canManage}
                          onChange={(event) =>
                            patchSelectedSlot((slot) => ({
                              ...slot,
                              focalPoint: event.target.value || slot.focalPoint?.x !== undefined
                                ? {
                                    x: slot.focalPoint?.x ?? 0.5,
                                    y: event.target.value ? clamp(Number(event.target.value) || 0, 0, 1) : 0,
                                  }
                                : undefined,
                            }))
                          }
                          className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/35">Style</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-xs text-white/45">
                      Font family
                      <input
                        value={selectedSlot.style?.fontFamily ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            fontFamily: event.target.value || undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/45">
                      Shadow
                      <select
                        value={selectedSlot.style?.shadow ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            shadow: event.target.value
                              ? (event.target.value as TemplateLayoutSlotStyle["shadow"])
                              : undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      >
                        <option value="">none</option>
                        {STYLE_SHADOW_OPTIONS.map((shadow) => (
                          <option key={shadow} value={shadow}>
                            {shadow}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="grid gap-1 text-xs text-white/45">
                      Color
                      <input
                        value={selectedSlot.style?.color ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            color: event.target.value || undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/45">
                      Background
                      <input
                        value={selectedSlot.style?.backgroundColor ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            backgroundColor: event.target.value || undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/45">
                      Border color
                      <input
                        value={selectedSlot.style?.borderColor ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            borderColor: event.target.value || undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="grid gap-1 text-xs text-white/45">
                      Font size
                      <input
                        type="number"
                        value={selectedSlot.style?.fontSize ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            fontSize: event.target.value ? Math.max(1, Number(event.target.value) || 1) : undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/45">
                      Line height
                      <input
                        type="number"
                        step="0.1"
                        value={selectedSlot.style?.lineHeight ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            lineHeight: event.target.value ? Math.max(0.5, Number(event.target.value) || 1) : undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/45">
                      Font weight
                      <input
                        type="number"
                        value={selectedSlot.style?.fontWeight ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            fontWeight: event.target.value ? Math.max(100, Number(event.target.value) || 400) : undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <label className="grid gap-1 text-xs text-white/45">
                      Border width
                      <input
                        type="number"
                        value={selectedSlot.style?.borderWidth ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            borderWidth: event.target.value ? Math.max(0, Number(event.target.value) || 0) : undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/45">
                      Border radius
                      <input
                        type="number"
                        value={selectedSlot.style?.borderRadius ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            borderRadius: event.target.value ? Math.max(0, Number(event.target.value) || 0) : undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/45">
                      Opacity
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step="0.05"
                        value={selectedSlot.style?.opacity ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            opacity: event.target.value ? clamp(Number(event.target.value) || 0, 0, 1) : undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/45">
                      Style align
                      <select
                        value={selectedSlot.style?.align ?? ""}
                        disabled={!canManage}
                        onChange={(event) =>
                          patchSelectedSlotStyle((style) => ({
                            ...style,
                            align: event.target.value
                              ? (event.target.value as TemplateLayoutSlotStyle["align"])
                              : undefined,
                          }))
                        }
                        className="rounded-lg border border-white/10 bg-[#09111c] px-3 py-2 text-sm text-white disabled:opacity-60"
                      >
                        <option value="">none</option>
                        {TEMPLATE_LAYOUT_TEXT_ALIGNMENTS.map((alignment) => (
                          <option key={alignment} value={alignment}>
                            {alignment}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/45">
                Select a slot from the canvas or layers panel to edit its metadata.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
