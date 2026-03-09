import { coerceTemplateLayoutDefinition, type TemplateLayoutSlotDefinition } from "./layoutTypes";
import type { GuidedTemplateV2 } from "./templateTypes";

export type ResolvedTextLayoutSlot = {
  slotId: string;
  kind: "text";
  role: "title" | "subtitle" | "body" | "quote" | "caption";
  bindingKey?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked?: boolean;
  required?: boolean;
  styleTokenRef?: string;
  editMode?: string;
  overflowBehavior?: string;
  maxLines?: number;
  alignment?: "left" | "center" | "right";
  style?: Record<string, unknown>;
};

export type ResolvedImageLayoutSlot = {
  slotId: string;
  kind: "image";
  frameType: "IMAGE" | "FRAME";
  captionSlotId?: string;
  bindingKey?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked?: boolean;
  required?: boolean;
  styleTokenRef?: string;
  editMode?: string;
  imageFit?: "cover" | "contain" | "fill";
  focalPoint?: {
    x: number;
    y: number;
  };
  style?: Record<string, unknown>;
};

export type ResolvedShapeLayoutSlot = {
  slotId: string;
  kind: "shape" | "decorative";
  shapeType: "rect";
  bindingKey?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked?: boolean;
  styleTokenRef?: string;
  editMode?: string;
  style?: Record<string, unknown>;
};

export type ResolvedLineLayoutSlot = {
  slotId: string;
  kind: "line";
  bindingKey?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked?: boolean;
  styleTokenRef?: string;
  editMode?: string;
  style?: Record<string, unknown>;
};

export type ResolvedFrameLayoutSlot = {
  slotId: string;
  kind: "frame";
  bindingKey?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked?: boolean;
  styleTokenRef?: string;
  editMode?: string;
  style?: Record<string, unknown>;
};

export type ResolvedLayoutSlot =
  | ResolvedTextLayoutSlot
  | ResolvedImageLayoutSlot
  | ResolvedShapeLayoutSlot
  | ResolvedLineLayoutSlot
  | ResolvedFrameLayoutSlot;

export type ResolvedChapterPageLayout = {
  pageLayoutId: string;
  source: "canonical" | "legacy" | "fallback";
  layoutVersion: number | null;
  sizePreset?: string;
  supportedOrientations?: string[];
  layoutFingerprint: string;
  slots: ResolvedLayoutSlot[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function inferTextRole(slotId: string): ResolvedTextLayoutSlot["role"] {
  const lower = slotId.toLowerCase();
  if (lower.includes("subtitle")) return "subtitle";
  if (lower.includes("quote") || lower.includes("pull")) return "quote";
  if (lower.includes("caption")) return "caption";
  if (lower.includes("body") || lower.includes("main") || lower.includes("text")) return "body";
  return "title";
}

function toSlotFingerprint(slot: ResolvedLayoutSlot) {
  const extras = [
    slot.bindingKey ?? "",
    slot.styleTokenRef ?? "",
    slot.editMode ?? "",
    slot.kind === "text"
      ? `${slot.overflowBehavior ?? ""}:${slot.maxLines ?? ""}:${slot.alignment ?? ""}`
      : "",
    slot.kind === "image"
      ? `${slot.imageFit ?? ""}:${slot.focalPoint ? `${slot.focalPoint.x},${slot.focalPoint.y}` : ""}`
      : ""
  ];
  return `${slot.slotId}:${slot.kind}:${slot.x}:${slot.y}:${slot.w}:${slot.h}:${slot.zIndex}:${extras.join(":")}`;
}

export function buildResolvedLayoutFingerprint(pageLayoutId: string, slots: ResolvedLayoutSlot[], layoutVersion: number | null) {
  return [pageLayoutId, layoutVersion ?? "legacy", ...slots.map(toSlotFingerprint)].join("|");
}

function coerceResolvedTextSlot(slot: TemplateLayoutSlotDefinition): ResolvedTextLayoutSlot {
  return {
    slotId: slot.slotId,
    kind: "text",
    role: inferTextRole(slot.role ?? slot.slotId),
    bindingKey: slot.bindingKey,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    zIndex: slot.zIndex,
    locked: slot.locked,
    required: slot.required,
    styleTokenRef: slot.styleTokenRef,
    editMode: slot.editMode,
    overflowBehavior: slot.overflowBehavior,
    maxLines: slot.maxLines,
    alignment: slot.alignment ?? slot.style?.align,
    style: slot.style
  };
}

function coerceResolvedImageSlot(slot: TemplateLayoutSlotDefinition): ResolvedImageLayoutSlot {
  return {
    slotId: slot.slotId,
    kind: "image",
    frameType: slot.frameType ?? "IMAGE",
    captionSlotId: slot.captionSlotId,
    bindingKey: slot.bindingKey,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    zIndex: slot.zIndex,
    locked: slot.locked,
    required: slot.required,
    styleTokenRef: slot.styleTokenRef,
    editMode: slot.editMode,
    imageFit: slot.imageFit,
    focalPoint: slot.focalPoint,
    style: slot.style
  };
}

function coerceResolvedFrameSlot(slot: TemplateLayoutSlotDefinition): ResolvedFrameLayoutSlot {
  return {
    slotId: slot.slotId,
    kind: "frame",
    bindingKey: slot.bindingKey,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    zIndex: slot.zIndex,
    locked: slot.locked,
    styleTokenRef: slot.styleTokenRef,
    editMode: slot.editMode,
    style: slot.style
  };
}

function coerceResolvedShapeSlot(slot: TemplateLayoutSlotDefinition): ResolvedShapeLayoutSlot {
  return {
    slotId: slot.slotId,
    kind: slot.kind === "decorative" ? "decorative" : "shape",
    shapeType: "rect",
    bindingKey: slot.bindingKey,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    zIndex: slot.zIndex,
    locked: slot.locked,
    styleTokenRef: slot.styleTokenRef,
    editMode: slot.editMode,
    style: slot.style
  };
}

function coerceResolvedLineSlot(slot: TemplateLayoutSlotDefinition): ResolvedLineLayoutSlot {
  return {
    slotId: slot.slotId,
    kind: "line",
    bindingKey: slot.bindingKey,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    zIndex: slot.zIndex,
    locked: slot.locked,
    styleTokenRef: slot.styleTokenRef,
    editMode: slot.editMode,
    style: slot.style
  };
}

function resolveCanonicalSlots(slots: TemplateLayoutSlotDefinition[]): ResolvedLayoutSlot[] {
  return slots.map((slot) => {
    if (slot.kind === "text") return coerceResolvedTextSlot(slot);
    if (slot.kind === "image") return coerceResolvedImageSlot(slot);
    if (slot.kind === "frame") return coerceResolvedFrameSlot(slot);
    if (slot.kind === "line") return coerceResolvedLineSlot(slot);
    return coerceResolvedShapeSlot(slot);
  });
}

function inferLegacySlotKind(slot: Record<string, unknown>): "text" | "image" | null {
  const candidates = [slot.kind, slot.type, slot.role, slot.slotId, slot.id]
    .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
    .filter(Boolean);
  if (candidates.some((value) => value.includes("image"))) return "image";
  if (candidates.some((value) => value.includes("text") || value.includes("title") || value.includes("caption") || value.includes("quote"))) {
    return "text";
  }
  return null;
}

function parseLegacySlot(slotValue: unknown, slotIndex: number): ResolvedLayoutSlot | null {
  const slot = isRecord(slotValue) ? slotValue : null;
  if (!slot) return null;
  const slotKind = inferLegacySlotKind(slot);
  if (!slotKind) return null;

  const slotId = stringValue(slot.slotId) ?? stringValue(slot.id) ?? `${slotKind}${slotIndex + 1}`;
  const x = numberValue(slot.x) ?? (slotKind === "image" ? 60 + slotIndex * 32 : 60);
  const y = numberValue(slot.y) ?? (slotKind === "image" ? 180 + slotIndex * 20 : 80 + slotIndex * 40);
  const w = Math.max(40, numberValue(slot.w) ?? (slotKind === "image" ? 300 : 600));
  const h = Math.max(40, numberValue(slot.h) ?? (slotKind === "image" ? 220 : 100));
  const zIndex = Math.max(1, numberValue(slot.zIndex) ?? slotIndex + 1);

  if (slotKind === "text") {
    return {
      slotId,
      kind: "text",
      role: inferTextRole(slotId),
      bindingKey: stringValue(slot.bindingKey) ?? undefined,
      x,
      y,
      w,
      h,
      zIndex
    };
  }

  const roleString = stringValue(slot.role)?.toLowerCase() ?? "";
  const typeString = stringValue(slot.type)?.toLowerCase() ?? "";
  return {
      slotId,
      kind: "image",
      frameType: roleString.includes("frame") || typeString.includes("frame") ? "FRAME" : "IMAGE",
      captionSlotId: stringValue(slot.captionSlotIdIfAny ?? slot.captionSlotId) ?? undefined,
      bindingKey: stringValue(slot.bindingKey) ?? undefined,
      x,
    y,
    w,
    h,
    zIndex
  };
}

function resolveLegacyStudioPages(templateJson: unknown, chapterKey: string): ResolvedChapterPageLayout[] {
  const template = isRecord(templateJson) ? templateJson : null;
  const studioPages = Array.isArray(template?.studioPages) ? template.studioPages : [];
  const chapterPages = studioPages.filter((page) => isRecord(page) && page.chapterKey === chapterKey);
  const parsed: ResolvedChapterPageLayout[] = [];
  chapterPages.forEach((page, index) => {
    const pageRecord = isRecord(page) ? page : null;
    if (!pageRecord) return;
    const slotsRaw = Array.isArray(pageRecord.slots) ? pageRecord.slots : [];
    const slots = slotsRaw.map((slotValue, slotIndex) => parseLegacySlot(slotValue, slotIndex)).filter((slot): slot is ResolvedLayoutSlot => Boolean(slot));
    if (slots.length === 0) return;
    const pageLayoutId = stringValue(pageRecord.pageTemplateId) ?? stringValue(pageRecord.layoutId) ?? `chapter_page_${index + 1}`;
    parsed.push({
      pageLayoutId,
      source: "legacy",
      layoutVersion: null,
      layoutFingerprint: buildResolvedLayoutFingerprint(pageLayoutId, slots, null),
      slots
    });
  });

  return parsed;
}

export function buildFallbackChapterPageLayouts(_chapterKey: string): ResolvedChapterPageLayout[] {
  const slots: ResolvedLayoutSlot[] = [
    { slotId: "title", kind: "text", role: "title", bindingKey: "chapterTitle", x: 60, y: 64, w: 696, h: 72, zIndex: 1, overflowBehavior: "shrink_to_fit", maxLines: 2, alignment: "center" },
    { slotId: "image1", kind: "image", frameType: "FRAME", captionSlotId: "caption1", bindingKey: "primaryImage", x: 60, y: 156, w: 470, h: 320, zIndex: 2, imageFit: "cover" },
    { slotId: "body", kind: "text", role: "body", bindingKey: "chapterBody", x: 552, y: 156, w: 204, h: 320, zIndex: 3, overflowBehavior: "shrink_to_fit" },
    { slotId: "quote", kind: "text", role: "quote", bindingKey: "chapterQuote", x: 60, y: 498, w: 696, h: 86, zIndex: 4, overflowBehavior: "clip", maxLines: 4 },
    { slotId: "caption1", kind: "text", role: "caption", bindingKey: "imageCaption1", x: 60, y: 484, w: 470, h: 20, zIndex: 5, overflowBehavior: "clip", maxLines: 2 },
    { slotId: "image2", kind: "image", frameType: "IMAGE", captionSlotId: "caption2", bindingKey: "galleryImage1", x: 60, y: 624, w: 332, h: 240, zIndex: 6, imageFit: "cover" },
    { slotId: "image3", kind: "image", frameType: "IMAGE", captionSlotId: "caption3", bindingKey: "galleryImage2", x: 424, y: 624, w: 332, h: 240, zIndex: 7, imageFit: "cover" },
    { slotId: "caption2", kind: "text", role: "caption", bindingKey: "imageCaption2", x: 60, y: 872, w: 332, h: 26, zIndex: 8, overflowBehavior: "clip", maxLines: 2 },
    { slotId: "caption3", kind: "text", role: "caption", bindingKey: "imageCaption3", x: 424, y: 872, w: 332, h: 26, zIndex: 9, overflowBehavior: "clip", maxLines: 2 }
  ];

  return [
    {
      pageLayoutId: "chapter_main_v1",
      source: "fallback",
      layoutVersion: null,
      layoutFingerprint: buildResolvedLayoutFingerprint("chapter_main_v1", slots, null),
      slots
    }
  ];
}

export function resolveTemplateChapterPageLayouts(
  templateJson: GuidedTemplateV2 | Record<string, unknown> | null | undefined,
  chapterKey: string,
  orientation?: "portrait" | "landscape"
): ResolvedChapterPageLayout[] {
  const layoutDefinition = coerceTemplateLayoutDefinition(templateJson);
  if (layoutDefinition) {
    const plan = layoutDefinition.chapterPagePlans.find((entry) => entry.chapterKey === chapterKey);
    if (plan) {
      const layoutById = new Map(layoutDefinition.pageLayouts.map((layout) => [layout.pageLayoutId, layout] as const));
      const resolved = plan.pages.flatMap((pageEntry) => {
        const selectedLayoutId =
          orientation === "landscape"
            ? pageEntry.alternativeLayoutIdsByOrientation?.landscape ?? pageEntry.pageLayoutId
            : pageEntry.pageLayoutId;
        const pageLayout = layoutById.get(selectedLayoutId);
        if (!pageLayout) return [];
        const slots = resolveCanonicalSlots(pageLayout.slots);
        return [{
          pageLayoutId: pageLayout.pageLayoutId,
          source: "canonical" as const,
          layoutVersion: layoutDefinition.layoutSchemaVersion,
          sizePreset: pageLayout.sizePreset,
          supportedOrientations: pageLayout.supportedOrientations,
          layoutFingerprint: buildResolvedLayoutFingerprint(pageLayout.pageLayoutId, slots, layoutDefinition.layoutSchemaVersion),
          slots
        } satisfies ResolvedChapterPageLayout];
      });

      if (resolved.length > 0) return resolved;
    }
  }

  const legacy = resolveLegacyStudioPages(templateJson, chapterKey);
  if (legacy.length > 0) return legacy;
  return buildFallbackChapterPageLayouts(chapterKey);
}
