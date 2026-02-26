import type { GuidedTemplateV2 } from "./templateTypes";
import type { SlotTarget } from "../illustrations/illustrationTypes";

type TemplateSlotMeta = {
  slotId?: string;
  id?: string;
  kind?: string;
  type?: string;
  role?: string;
  aspectRatio?: number;
  orientation?: "landscape" | "portrait" | "square";
  sizeClass?: "cover" | "large" | "medium" | "small";
};

type TemplateStudioPage = {
  chapterKey?: string;
  slots?: TemplateSlotMeta[];
};

type TemplateWithStudioPages = GuidedTemplateV2 & {
  studioPages?: TemplateStudioPage[];
};

const FALLBACK_SLOT_ORDER = ["image1", "image2", "image3"] as const;

const FALLBACK_SLOT_RULES: Record<(typeof FALLBACK_SLOT_ORDER)[number], { aspectTarget: number; sizeClass: "large" | "medium" }> = {
  image1: { aspectTarget: 4 / 3, sizeClass: "large" },
  image2: { aspectTarget: 1, sizeClass: "medium" },
  image3: { aspectTarget: 3 / 4, sizeClass: "medium" }
};

function orientationFromAspect(aspectTarget: number): SlotTarget["orientation"] {
  if (Math.abs(aspectTarget - 1) < 0.06) return "square";
  return aspectTarget > 1 ? "landscape" : "portrait";
}

function minShortSideBySizeClass(sizeClass: string | undefined): number {
  if (sizeClass === "cover") return 2600;
  if (sizeClass === "large") return 1800;
  if (sizeClass === "small") return 1000;
  return 1400;
}

function normalizeAspectRatio(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    if (value.includes(":")) {
      const [w, h] = value.split(":").map((part) => Number.parseFloat(part));
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return w / h;
    }
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

function isImageSlot(slot: TemplateSlotMeta) {
  const candidates = [slot.kind, slot.type, slot.role, slot.slotId, slot.id]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());
  return candidates.some((value) => value.includes("image"));
}

function slotIdOf(slot: TemplateSlotMeta, fallbackIndex: number) {
  let raw: string | null = null;
  if (typeof slot.slotId === "string") raw = slot.slotId;
  else if (typeof slot.id === "string") raw = slot.id;
  if (raw && raw.trim()) return raw.trim();
  return `image${fallbackIndex + 1}`;
}

function dedupeBySlotId(slotTargets: SlotTarget[]) {
  const seen = new Set<string>();
  const out: SlotTarget[] = [];
  for (const slot of slotTargets) {
    if (seen.has(slot.slotId)) continue;
    seen.add(slot.slotId);
    out.push(slot);
  }
  return out;
}

export function extractSlotTargetsForChapter(
  templateJson: GuidedTemplateV2 | (Record<string, unknown> & Partial<TemplateWithStudioPages>),
  chapterKey: string
): SlotTarget[] {
  const template = templateJson as Partial<TemplateWithStudioPages>;
  const pages = Array.isArray(template.studioPages) ? template.studioPages : [];
  const chapterPages = pages.filter((page) => page && page.chapterKey === chapterKey);

  const extracted = chapterPages.flatMap((page) => {
    const slots = Array.isArray(page.slots) ? page.slots : [];
    return slots
      .filter(isImageSlot)
      .map((slot, index) => {
        const fallback = FALLBACK_SLOT_RULES[FALLBACK_SLOT_ORDER[Math.min(index, FALLBACK_SLOT_ORDER.length - 1)]];
        const aspectTarget = normalizeAspectRatio(slot.aspectRatio, fallback.aspectTarget);
        return {
          slotId: slotIdOf(slot, index),
          aspectTarget,
          orientation: slot.orientation ?? orientationFromAspect(aspectTarget),
          minShortSidePx: minShortSideBySizeClass(slot.sizeClass ?? fallback.sizeClass)
        } satisfies SlotTarget;
      });
  });

  if (extracted.length > 0) return dedupeBySlotId(extracted);

  return FALLBACK_SLOT_ORDER.map((slotId) => {
    const rule = FALLBACK_SLOT_RULES[slotId];
    return {
      slotId,
      aspectTarget: rule.aspectTarget,
      orientation: orientationFromAspect(rule.aspectTarget),
      minShortSidePx: minShortSideBySizeClass(rule.sizeClass)
    } satisfies SlotTarget;
  });
}
