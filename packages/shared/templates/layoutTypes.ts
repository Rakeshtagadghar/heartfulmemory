import { pageSizePresets, type PageSizePreset } from "../../shared-schema/pageFrame.types";

export const TEMPLATE_LAYOUT_SCHEMA_VERSION = 1 as const;

export const TEMPLATE_PAGE_ORIENTATIONS = ["portrait", "landscape"] as const;
export type TemplatePageOrientation = (typeof TEMPLATE_PAGE_ORIENTATIONS)[number];

export const TEMPLATE_LAYOUT_SLOT_KINDS = [
  "text",
  "image",
  "frame",
  "shape",
  "line",
  "decorative"
] as const;
export type TemplateLayoutSlotKind = (typeof TEMPLATE_LAYOUT_SLOT_KINDS)[number];

export const TEMPLATE_LAYOUT_SLOT_EDIT_MODES = [
  "editable",
  "populate_only",
  "readonly_decorative"
] as const;
export type TemplateLayoutSlotEditMode = (typeof TEMPLATE_LAYOUT_SLOT_EDIT_MODES)[number];

export const TEMPLATE_LAYOUT_TEXT_OVERFLOW_BEHAVIORS = [
  "clip",
  "shrink_to_fit",
  "continue_to_next_slot",
  "continue_to_next_page"
] as const;
export type TemplateLayoutTextOverflowBehavior =
  (typeof TEMPLATE_LAYOUT_TEXT_OVERFLOW_BEHAVIORS)[number];

export const TEMPLATE_LAYOUT_TEXT_ALIGNMENTS = ["left", "center", "right"] as const;
export type TemplateLayoutTextAlignment = (typeof TEMPLATE_LAYOUT_TEXT_ALIGNMENTS)[number];

export const TEMPLATE_LAYOUT_IMAGE_FITS = ["cover", "contain", "fill"] as const;
export type TemplateLayoutImageFit = (typeof TEMPLATE_LAYOUT_IMAGE_FITS)[number];

export const TEMPLATE_LAYOUT_PAGE_ROLES = [
  "cover",
  "chapter_opener",
  "story_page",
  "gallery_page",
  "quote_page",
  "answer_page",
  "ending_page"
] as const;
export type TemplateLayoutPageRole = (typeof TEMPLATE_LAYOUT_PAGE_ROLES)[number];

export type TemplateLayoutSlotStyle = {
  color?: string;
  fill?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: "none" | "soft";
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: number;
  align?: "left" | "center" | "right";
  opacity?: number;
};

export type TemplateLayoutSlotDefinition = {
  slotId: string;
  kind: TemplateLayoutSlotKind;
  role?: string;
  bindingKey?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked?: boolean;
  required?: boolean;
  style?: TemplateLayoutSlotStyle;
  styleTokenRef?: string;
  allowedContentSources?: string[];
  editMode?: TemplateLayoutSlotEditMode;
  captionSlotId?: string;
  minTextLength?: number;
  maxTextLength?: number;
  overflowBehavior?: TemplateLayoutTextOverflowBehavior;
  maxLines?: number;
  alignment?: TemplateLayoutTextAlignment;
  imageFit?: TemplateLayoutImageFit;
  focalPoint?: {
    x: number;
    y: number;
  };
  frameType?: "IMAGE" | "FRAME";
};

export type TemplatePageLayoutDefinition = {
  pageLayoutId: string;
  name: string;
  description?: string;
  pageRole?: TemplateLayoutPageRole;
  pageType?: string;
  sizePreset: PageSizePreset;
  supportedOrientations: TemplatePageOrientation[];
  supportsReflowMode?: boolean;
  previewThumbnailUrl?: string;
  slots: TemplateLayoutSlotDefinition[];
  defaultStyles?: TemplateLayoutSlotStyle;
  constraints?: Record<string, unknown>;
};

export type TemplateChapterPagePlanEntry = {
  pageLayoutId: string;
  pageRole?: TemplateLayoutPageRole;
  alternativeLayoutIdsByOrientation?: Partial<Record<TemplatePageOrientation, string>>;
};

export type TemplateChapterPagePlan = {
  chapterKey: string;
  pages: TemplateChapterPagePlanEntry[];
};

export type TemplateLayoutCompatibility = {
  swapGroup?: string;
  compatibleLayoutIds?: string[];
};

export type TemplateLayoutDefinition = {
  layoutSchemaVersion: typeof TEMPLATE_LAYOUT_SCHEMA_VERSION;
  pageLayouts: TemplatePageLayoutDefinition[];
  chapterPagePlans: TemplateChapterPagePlan[];
  defaultPageLayoutIdsByRole?: Partial<Record<TemplateLayoutPageRole, string>>;
  orientationVariants?: Record<string, Partial<Record<TemplatePageOrientation, string>>>;
  layoutCompatibility?: Record<string, TemplateLayoutCompatibility>;
};

export type TemplateLayoutValidationErrorCode =
  | "LAYOUT_SCHEMA_VERSION_INVALID"
  | "PAGE_LAYOUTS_REQUIRED"
  | "PAGE_LAYOUT_ID_DUPLICATE"
  | "PAGE_LAYOUT_ID_UNKNOWN"
  | "PAGE_LAYOUT_NAME_REQUIRED"
  | "PAGE_LAYOUT_SIZE_PRESET_INVALID"
  | "PAGE_LAYOUT_ORIENTATION_INVALID"
  | "PAGE_LAYOUT_SLOTS_REQUIRED"
  | "SLOT_ID_DUPLICATE"
  | "SLOT_ID_REQUIRED"
  | "SLOT_KIND_INVALID"
  | "SLOT_GEOMETRY_INVALID"
  | "SLOT_Z_INDEX_INVALID"
  | "SLOT_CAPTION_REFERENCE_INVALID"
  | "SLOT_TEXT_LENGTH_INVALID"
  | "SLOT_BINDING_KEY_DUPLICATE"
  | "SLOT_FIELD_KIND_INVALID"
  | "CHAPTER_PAGE_PLAN_INVALID"
  | "DEFAULT_LAYOUT_REFERENCE_INVALID"
  | "ORIENTATION_VARIANT_REFERENCE_INVALID"
  | "LAYOUT_COMPATIBILITY_REFERENCE_INVALID"
  | "SLOT_BINDING_REFERENCE_INVALID";

export type TemplateLayoutValidationError = {
  code: TemplateLayoutValidationErrorCode;
  path: string;
  message: string;
};

export type TemplateLayoutValidationResult = {
  ok: boolean;
  errors: TemplateLayoutValidationError[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTrimmedString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => readTrimmedString(item))
    .filter((item): item is string => Boolean(item));
  return items.length > 0 ? items : undefined;
}

function isPageOrientation(value: unknown): value is TemplatePageOrientation {
  return (TEMPLATE_PAGE_ORIENTATIONS as readonly string[]).includes(value as string);
}

function isSlotKind(value: unknown): value is TemplateLayoutSlotKind {
  return (TEMPLATE_LAYOUT_SLOT_KINDS as readonly string[]).includes(value as string);
}

function isSlotEditMode(value: unknown): value is TemplateLayoutSlotEditMode {
  return (TEMPLATE_LAYOUT_SLOT_EDIT_MODES as readonly string[]).includes(value as string);
}

function isTextOverflowBehavior(value: unknown): value is TemplateLayoutTextOverflowBehavior {
  return (TEMPLATE_LAYOUT_TEXT_OVERFLOW_BEHAVIORS as readonly string[]).includes(value as string);
}

function isTextAlignment(value: unknown): value is TemplateLayoutTextAlignment {
  return (TEMPLATE_LAYOUT_TEXT_ALIGNMENTS as readonly string[]).includes(value as string);
}

function isImageFit(value: unknown): value is TemplateLayoutImageFit {
  return (TEMPLATE_LAYOUT_IMAGE_FITS as readonly string[]).includes(value as string);
}

function isPageRole(value: unknown): value is TemplateLayoutPageRole {
  return (TEMPLATE_LAYOUT_PAGE_ROLES as readonly string[]).includes(value as string);
}

function isPageSizePreset(value: unknown): value is PageSizePreset {
  return (pageSizePresets as readonly string[]).includes(value as string);
}

function coerceSlotStyle(value: unknown): TemplateLayoutSlotStyle | undefined {
  if (!isRecord(value)) return undefined;

  const style: TemplateLayoutSlotStyle = {};
  if (typeof value.color === "string") style.color = value.color;
  if (typeof value.fill === "string") style.fill = value.fill;
  if (typeof value.backgroundColor === "string") style.backgroundColor = value.backgroundColor;
  if (typeof value.borderColor === "string") style.borderColor = value.borderColor;
  if (typeof value.shadow === "string" && (value.shadow === "none" || value.shadow === "soft")) style.shadow = value.shadow;
  if (typeof value.fontFamily === "string") style.fontFamily = value.fontFamily;
  if (typeof value.align === "string" && ["left", "center", "right"].includes(value.align)) {
    style.align = value.align as TemplateLayoutSlotStyle["align"];
  }

  const numericKeys = ["borderWidth", "borderRadius", "fontSize", "lineHeight", "fontWeight", "opacity"] as const;
  for (const key of numericKeys) {
    const numericValue = readFiniteNumber(value[key]);
    if (numericValue !== null) {
      (style as Record<string, unknown>)[key] = numericValue;
    }
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

function coerceFocalPoint(value: unknown): TemplateLayoutSlotDefinition["focalPoint"] | undefined {
  if (!isRecord(value)) return undefined;
  const x = readFiniteNumber(value.x);
  const y = readFiniteNumber(value.y);
  if (x === null || y === null) return undefined;
  return { x, y };
}

function coerceSlotDefinition(value: unknown): TemplateLayoutSlotDefinition | null {
  if (!isRecord(value)) return null;

  const slotId = readTrimmedString(value.slotId) ?? readTrimmedString(value.id);
  const kind = value.kind;
  const x = readFiniteNumber(value.x);
  const y = readFiniteNumber(value.y);
  const w = readFiniteNumber(value.w);
  const h = readFiniteNumber(value.h);
  const zIndex = readFiniteNumber(value.zIndex);

  if (!slotId || !isSlotKind(kind) || x === null || y === null || w === null || h === null || zIndex === null) {
    return null;
  }

  return {
    slotId,
    kind,
    role: readTrimmedString(value.role) ?? undefined,
    bindingKey: readTrimmedString(value.bindingKey) ?? undefined,
    x,
    y,
    w,
    h,
    zIndex,
    locked: typeof value.locked === "boolean" ? value.locked : undefined,
    required: typeof value.required === "boolean" ? value.required : undefined,
    style: coerceSlotStyle(value.style),
    styleTokenRef: readTrimmedString(value.styleTokenRef) ?? undefined,
    allowedContentSources: readStringArray(value.allowedContentSources),
    editMode: isSlotEditMode(value.editMode) ? value.editMode : undefined,
    captionSlotId: readTrimmedString(value.captionSlotIdIfAny ?? value.captionSlotId) ?? undefined,
    minTextLength: readFiniteNumber(value.minTextLengthIfAny ?? value.minTextLength) ?? undefined,
    maxTextLength: readFiniteNumber(value.maxTextLengthIfAny ?? value.maxTextLength) ?? undefined,
    overflowBehavior: (() => {
      const overflowBehavior = value.overflowBehaviorIfText ?? value.overflowBehavior;
      return isTextOverflowBehavior(overflowBehavior) ? overflowBehavior : undefined;
    })(),
    maxLines: readFiniteNumber(value.maxLinesIfText ?? value.maxLines) ?? undefined,
    alignment: (() => {
      const alignment = value.alignmentIfText ?? value.alignment;
      return isTextAlignment(alignment) ? alignment : undefined;
    })(),
    imageFit: (() => {
      const imageFit = value.imageFitIfImage ?? value.imageFit;
      return isImageFit(imageFit) ? imageFit : undefined;
    })(),
    focalPoint: coerceFocalPoint(value.focalPointIfImage ?? value.focalPoint),
    frameType:
      value.frameType === "IMAGE" || value.frameType === "FRAME"
        ? value.frameType
        : undefined
  };
}

function coercePageLayoutDefinition(value: unknown): TemplatePageLayoutDefinition | null {
  if (!isRecord(value)) return null;

  const pageLayoutId = readTrimmedString(value.pageLayoutId);
  const name = readTrimmedString(value.name);
  const sizePreset = value.sizePreset;
  const rawSupportedOrientations = Array.isArray(value.supportedOrientations)
    ? value.supportedOrientations.filter(isPageOrientation)
    : [];
  const slots = Array.isArray(value.slots)
    ? value.slots.map(coerceSlotDefinition).filter((slot): slot is TemplateLayoutSlotDefinition => Boolean(slot))
    : [];

  if (!pageLayoutId || !name || !isPageSizePreset(sizePreset) || rawSupportedOrientations.length === 0 || slots.length === 0) {
    return null;
  }

  return {
    pageLayoutId,
    name,
    description: readTrimmedString(value.description) ?? undefined,
    pageRole: isPageRole(value.pageRole) ? value.pageRole : undefined,
    pageType: readTrimmedString(value.pageType) ?? undefined,
    sizePreset,
    supportedOrientations: rawSupportedOrientations,
    supportsReflowMode: typeof value.supportsReflowMode === "boolean" ? value.supportsReflowMode : undefined,
    previewThumbnailUrl: readTrimmedString(value.previewThumbnailUrlIfAvailable ?? value.previewThumbnailUrl) ?? undefined,
    slots,
    defaultStyles: coerceSlotStyle(value.defaultStyles),
    constraints: isRecord(value.constraints) ? value.constraints : undefined
  };
}

function coerceChapterPagePlanEntry(value: unknown): TemplateChapterPagePlanEntry | null {
  if (!isRecord(value)) return null;
  const pageLayoutId = readTrimmedString(value.pageLayoutId);
  if (!pageLayoutId) return null;

  const alternativeLayoutIdsByOrientation = isRecord(value.alternativeLayoutIdsByOrientation)
    ? Object.fromEntries(
      Object.entries(value.alternativeLayoutIdsByOrientation)
        .filter(([orientation, target]) => isPageOrientation(orientation) && Boolean(readTrimmedString(target)))
        .map(([orientation, target]) => [orientation, readTrimmedString(target)!])
    )
    : undefined;

  return {
    pageLayoutId,
    pageRole: isPageRole(value.pageRole) ? value.pageRole : undefined,
    alternativeLayoutIdsByOrientation:
      alternativeLayoutIdsByOrientation && Object.keys(alternativeLayoutIdsByOrientation).length > 0
        ? alternativeLayoutIdsByOrientation
        : undefined
  };
}

function coerceChapterPagePlan(value: unknown): TemplateChapterPagePlan | null {
  if (!isRecord(value)) return null;
  const chapterKey = readTrimmedString(value.chapterKey);
  const pages = Array.isArray(value.pages)
    ? value.pages.map(coerceChapterPagePlanEntry).filter((entry): entry is TemplateChapterPagePlanEntry => Boolean(entry))
    : [];

  if (!chapterKey || pages.length === 0) return null;
  return { chapterKey, pages };
}

function coerceOrientationVariants(
  value: unknown
): TemplateLayoutDefinition["orientationVariants"] | undefined {
  if (!isRecord(value)) return undefined;

  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([, variants]) => isRecord(variants))
      .map(([layoutId, variants]) => [
        layoutId,
        Object.fromEntries(
          Object.entries(variants as Record<string, unknown>)
            .filter(([orientation, target]) => isPageOrientation(orientation) && Boolean(readTrimmedString(target)))
            .map(([orientation, target]) => [orientation, readTrimmedString(target)!])
        )
      ])
      .filter(([, variants]) => Object.keys(variants as Record<string, string>).length > 0)
  );

  return Object.keys(result).length > 0 ? result : undefined;
}

function coerceLayoutCompatibility(
  value: unknown
): TemplateLayoutDefinition["layoutCompatibility"] | undefined {
  if (!isRecord(value)) return undefined;

  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([, compatibility]) => isRecord(compatibility))
      .map(([layoutId, compatibility]) => {
        const compatibleLayoutIds = readStringArray((compatibility as Record<string, unknown>).compatibleLayoutIds);
        const swapGroup = readTrimmedString((compatibility as Record<string, unknown>).swapGroup) ?? undefined;
        return [
          layoutId,
          {
            ...(swapGroup ? { swapGroup } : {}),
            ...(compatibleLayoutIds ? { compatibleLayoutIds } : {})
          } satisfies TemplateLayoutCompatibility
        ] as const;
      })
      .filter(([, compatibility]) => Object.keys(compatibility).length > 0)
  );

  return Object.keys(result).length > 0 ? result : undefined;
}

export function hasTemplateLayoutDefinition(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    "layoutSchemaVersion" in value ||
    "pageLayouts" in value ||
    "chapterPagePlans" in value ||
    "defaultPageLayoutIdsByRole" in value ||
    "orientationVariants" in value ||
    "layoutCompatibility" in value
  );
}

export function coerceTemplateLayoutDefinition(value: unknown): TemplateLayoutDefinition | null {
  if (!hasTemplateLayoutDefinition(value)) return null;
  if (!isRecord(value)) return null;

  const layoutSchemaVersion = readFiniteNumber(value.layoutSchemaVersion);
  const pageLayouts = Array.isArray(value.pageLayouts)
    ? value.pageLayouts
      .map(coercePageLayoutDefinition)
      .filter((layout): layout is TemplatePageLayoutDefinition => Boolean(layout))
    : [];
  const chapterPagePlans = Array.isArray(value.chapterPagePlans)
    ? value.chapterPagePlans
      .map(coerceChapterPagePlan)
      .filter((plan): plan is TemplateChapterPagePlan => Boolean(plan))
    : [];

  if (layoutSchemaVersion !== TEMPLATE_LAYOUT_SCHEMA_VERSION || pageLayouts.length === 0 || chapterPagePlans.length === 0) {
    return null;
  }

  const defaultPageLayoutIdsByRole = isRecord(value.defaultPageLayoutIdsByRole)
    ? Object.fromEntries(
      Object.entries(value.defaultPageLayoutIdsByRole)
        .filter(([role, layoutId]) => isPageRole(role) && Boolean(readTrimmedString(layoutId)))
        .map(([role, layoutId]) => [role, readTrimmedString(layoutId)!])
    )
    : undefined;

  return {
    layoutSchemaVersion: TEMPLATE_LAYOUT_SCHEMA_VERSION,
    pageLayouts,
    chapterPagePlans,
    defaultPageLayoutIdsByRole:
      defaultPageLayoutIdsByRole && Object.keys(defaultPageLayoutIdsByRole).length > 0
        ? defaultPageLayoutIdsByRole
        : undefined,
    orientationVariants: coerceOrientationVariants(value.orientationVariants),
    layoutCompatibility: coerceLayoutCompatibility(value.layoutCompatibility)
  };
}

export function validateTemplateLayoutDefinition(
  definition: TemplateLayoutDefinition | null | undefined,
  options?: {
    requireDefinition?: boolean;
    slotBindings?: Array<{
      pageLayoutId?: string | null;
      slotId?: string | null;
      bindingKey?: string;
      slotBindingKey?: string | null;
    }>;
  }
): TemplateLayoutValidationResult {
  const errors: TemplateLayoutValidationError[] = [];

  if (!definition) {
    if (options?.requireDefinition) {
      errors.push({
        code: "PAGE_LAYOUTS_REQUIRED",
        path: "pageLayouts",
        message: "At least one canonical page layout is required."
      });
    }
    return { ok: errors.length === 0, errors };
  }

  if (definition.layoutSchemaVersion !== TEMPLATE_LAYOUT_SCHEMA_VERSION) {
    errors.push({
      code: "LAYOUT_SCHEMA_VERSION_INVALID",
      path: "layoutSchemaVersion",
      message: `Layout schema version must be ${TEMPLATE_LAYOUT_SCHEMA_VERSION}.`
    });
  }

  if (definition.pageLayouts.length === 0) {
    errors.push({
      code: "PAGE_LAYOUTS_REQUIRED",
      path: "pageLayouts",
      message: "At least one page layout is required."
    });
  }

  const pageLayoutIds = new Set<string>();
  const slotIdsByLayout = new Map<string, Set<string>>();
  const bindingKeysByLayout = new Map<string, Set<string>>();
  const slotIdByBindingKeyByLayout = new Map<string, Map<string, string>>();

  for (const [layoutIndex, layout] of definition.pageLayouts.entries()) {
    const layoutPath = `pageLayouts[${layoutIndex}]`;
    if (!layout.pageLayoutId.trim()) {
      errors.push({
        code: "PAGE_LAYOUT_ID_UNKNOWN",
        path: `${layoutPath}.pageLayoutId`,
        message: "Page layout id is required."
      });
    } else if (pageLayoutIds.has(layout.pageLayoutId)) {
      errors.push({
        code: "PAGE_LAYOUT_ID_DUPLICATE",
        path: `${layoutPath}.pageLayoutId`,
        message: `Duplicate page layout id "${layout.pageLayoutId}".`
      });
    } else {
      pageLayoutIds.add(layout.pageLayoutId);
    }

    if (!layout.name.trim()) {
      errors.push({
        code: "PAGE_LAYOUT_NAME_REQUIRED",
        path: `${layoutPath}.name`,
        message: "Page layout name is required."
      });
    }

    if (!isPageSizePreset(layout.sizePreset)) {
      errors.push({
        code: "PAGE_LAYOUT_SIZE_PRESET_INVALID",
        path: `${layoutPath}.sizePreset`,
        message: `Unsupported page size preset "${String(layout.sizePreset)}".`
      });
    }

    if (layout.supportedOrientations.length === 0 || layout.supportedOrientations.some((orientation) => !isPageOrientation(orientation))) {
      errors.push({
        code: "PAGE_LAYOUT_ORIENTATION_INVALID",
        path: `${layoutPath}.supportedOrientations`,
        message: "Each page layout must declare at least one supported orientation."
      });
    }

    if (layout.slots.length === 0) {
      errors.push({
        code: "PAGE_LAYOUT_SLOTS_REQUIRED",
        path: `${layoutPath}.slots`,
        message: "Each page layout must define at least one slot."
      });
      continue;
    }

    const slotIds = new Set<string>();
    const bindingKeys = new Set<string>();
    const slotIdByBindingKey = new Map<string, string>();
    slotIdsByLayout.set(layout.pageLayoutId, slotIds);
    bindingKeysByLayout.set(layout.pageLayoutId, bindingKeys);
    slotIdByBindingKeyByLayout.set(layout.pageLayoutId, slotIdByBindingKey);
    for (const [slotIndex, slot] of layout.slots.entries()) {
      const slotPath = `${layoutPath}.slots[${slotIndex}]`;
      if (!slot.slotId.trim()) {
        errors.push({
          code: "SLOT_ID_REQUIRED",
          path: `${slotPath}.slotId`,
          message: "Slot id is required."
        });
      } else if (slotIds.has(slot.slotId)) {
        errors.push({
          code: "SLOT_ID_DUPLICATE",
          path: `${slotPath}.slotId`,
          message: `Duplicate slot id "${slot.slotId}" in layout "${layout.pageLayoutId}".`
        });
      } else {
        slotIds.add(slot.slotId);
      }

      if (slot.bindingKey) {
        if (bindingKeys.has(slot.bindingKey)) {
          errors.push({
            code: "SLOT_BINDING_KEY_DUPLICATE",
            path: `${slotPath}.bindingKey`,
            message: `Duplicate bindingKey "${slot.bindingKey}" in layout "${layout.pageLayoutId}".`
          });
        } else {
          bindingKeys.add(slot.bindingKey);
          slotIdByBindingKey.set(slot.bindingKey, slot.slotId);
        }
      }

      if (!isSlotKind(slot.kind)) {
        errors.push({
          code: "SLOT_KIND_INVALID",
          path: `${slotPath}.kind`,
          message: `Unsupported slot kind "${String(slot.kind)}".`
        });
      }

      if (!Number.isFinite(slot.x) || !Number.isFinite(slot.y) || !Number.isFinite(slot.w) || !Number.isFinite(slot.h) || slot.w <= 0 || slot.h <= 0) {
        errors.push({
          code: "SLOT_GEOMETRY_INVALID",
          path: slotPath,
          message: `Slot "${slot.slotId}" must have finite x, y, w, h values and positive width/height.`
        });
      }

      if (!Number.isInteger(slot.zIndex) || slot.zIndex < 0) {
        errors.push({
          code: "SLOT_Z_INDEX_INVALID",
          path: `${slotPath}.zIndex`,
          message: `Slot "${slot.slotId}" must have a non-negative integer zIndex.`
        });
      }

      if (slot.captionSlotId && !layout.slots.some((candidate) => candidate.slotId === slot.captionSlotId)) {
        errors.push({
          code: "SLOT_CAPTION_REFERENCE_INVALID",
          path: `${slotPath}.captionSlotId`,
          message: `Caption slot "${slot.captionSlotId}" does not exist in layout "${layout.pageLayoutId}".`
        });
      }

      if (
        slot.minTextLength !== undefined &&
        slot.maxTextLength !== undefined &&
        slot.maxTextLength < slot.minTextLength
      ) {
        errors.push({
          code: "SLOT_TEXT_LENGTH_INVALID",
          path: slotPath,
          message: `Slot "${slot.slotId}" has maxTextLength smaller than minTextLength.`
        });
      }

      const hasTextOnlyFields =
        slot.minTextLength !== undefined ||
        slot.maxTextLength !== undefined ||
        slot.overflowBehavior !== undefined ||
        slot.maxLines !== undefined ||
        slot.alignment !== undefined;
      if (hasTextOnlyFields && slot.kind !== "text") {
        errors.push({
          code: "SLOT_FIELD_KIND_INVALID",
          path: slotPath,
          message: `Slot "${slot.slotId}" uses text-only fields but is not a text slot.`
        });
      }

      if (slot.maxLines !== undefined && (!Number.isInteger(slot.maxLines) || slot.maxLines <= 0)) {
        errors.push({
          code: "SLOT_FIELD_KIND_INVALID",
          path: `${slotPath}.maxLines`,
          message: `Slot "${slot.slotId}" must have a positive integer maxLines value.`
        });
      }

      const hasImageOnlyFields = slot.imageFit !== undefined || slot.focalPoint !== undefined;
      if (hasImageOnlyFields && slot.kind !== "image") {
        errors.push({
          code: "SLOT_FIELD_KIND_INVALID",
          path: slotPath,
          message: `Slot "${slot.slotId}" uses image-only fields but is not an image slot.`
        });
      }

      if (slot.focalPoint && (slot.focalPoint.x < 0 || slot.focalPoint.x > 1 || slot.focalPoint.y < 0 || slot.focalPoint.y > 1)) {
        errors.push({
          code: "SLOT_FIELD_KIND_INVALID",
          path: `${slotPath}.focalPoint`,
          message: `Slot "${slot.slotId}" focalPoint must use normalized 0-1 coordinates.`
        });
      }
    }
  }

  for (const [planIndex, plan] of definition.chapterPagePlans.entries()) {
    for (const [pageIndex, page] of plan.pages.entries()) {
      const planPath = `chapterPagePlans[${planIndex}].pages[${pageIndex}]`;
      if (!pageLayoutIds.has(page.pageLayoutId)) {
        errors.push({
          code: "CHAPTER_PAGE_PLAN_INVALID",
          path: `${planPath}.pageLayoutId`,
          message: `Chapter plan references unknown page layout "${page.pageLayoutId}".`
        });
      }

      for (const [orientation, layoutId] of Object.entries(page.alternativeLayoutIdsByOrientation ?? {})) {
        if (!isPageOrientation(orientation) || !pageLayoutIds.has(layoutId)) {
          errors.push({
            code: "CHAPTER_PAGE_PLAN_INVALID",
            path: `${planPath}.alternativeLayoutIdsByOrientation.${orientation}`,
            message: `Alternative layout "${layoutId}" is invalid for orientation "${orientation}".`
          });
        }
      }
    }
  }

  for (const [role, layoutId] of Object.entries(definition.defaultPageLayoutIdsByRole ?? {})) {
    if (!isPageRole(role) || !pageLayoutIds.has(layoutId)) {
      errors.push({
        code: "DEFAULT_LAYOUT_REFERENCE_INVALID",
        path: `defaultPageLayoutIdsByRole.${role}`,
        message: `Default layout reference "${layoutId}" for role "${role}" is invalid.`
      });
    }
  }

  for (const [layoutId, variants] of Object.entries(definition.orientationVariants ?? {})) {
    if (!pageLayoutIds.has(layoutId)) {
      errors.push({
        code: "ORIENTATION_VARIANT_REFERENCE_INVALID",
        path: `orientationVariants.${layoutId}`,
        message: `Orientation variants reference unknown base layout "${layoutId}".`
      });
    }

    for (const [orientation, targetLayoutId] of Object.entries(variants)) {
      if (!isPageOrientation(orientation) || !pageLayoutIds.has(targetLayoutId)) {
        errors.push({
          code: "ORIENTATION_VARIANT_REFERENCE_INVALID",
          path: `orientationVariants.${layoutId}.${orientation}`,
          message: `Orientation variant target "${targetLayoutId}" is invalid for "${layoutId}".`
        });
      }
    }
  }

  for (const [layoutId, compatibility] of Object.entries(definition.layoutCompatibility ?? {})) {
    if (!pageLayoutIds.has(layoutId)) {
      errors.push({
        code: "LAYOUT_COMPATIBILITY_REFERENCE_INVALID",
        path: `layoutCompatibility.${layoutId}`,
        message: `Layout compatibility references unknown layout "${layoutId}".`
      });
    }

    for (const compatibleLayoutId of compatibility.compatibleLayoutIds ?? []) {
      if (!pageLayoutIds.has(compatibleLayoutId)) {
        errors.push({
          code: "LAYOUT_COMPATIBILITY_REFERENCE_INVALID",
          path: `layoutCompatibility.${layoutId}.compatibleLayoutIds`,
          message: `Compatible layout "${compatibleLayoutId}" is not defined.`
        });
      }
    }
  }

  for (const [bindingIndex, binding] of (options?.slotBindings ?? []).entries()) {
    const bindingPath = binding.bindingKey ? `slotBindings.${binding.bindingKey}` : `slotBindings[${bindingIndex}]`;
    if (!binding.pageLayoutId) continue;
    const slotIds = slotIdsByLayout.get(binding.pageLayoutId);
    const slotIdByBindingKey = slotIdByBindingKeyByLayout.get(binding.pageLayoutId);
    if (!slotIds) {
      errors.push({
        code: "SLOT_BINDING_REFERENCE_INVALID",
        path: bindingPath,
        message: `Slot binding references missing layout "${binding.pageLayoutId}".`
      });
      continue;
    }

    if (binding.slotId && !slotIds.has(binding.slotId)) {
      errors.push({
        code: "SLOT_BINDING_REFERENCE_INVALID",
        path: bindingPath,
        message: `Slot binding references missing slot "${binding.slotId}" on layout "${binding.pageLayoutId}".`
      });
    }

    if (binding.slotBindingKey) {
      const resolvedSlotId = slotIdByBindingKey?.get(binding.slotBindingKey);
      if (!resolvedSlotId) {
        errors.push({
          code: "SLOT_BINDING_REFERENCE_INVALID",
          path: bindingPath,
          message: `Slot binding references missing bindingKey "${binding.slotBindingKey}" on layout "${binding.pageLayoutId}".`
        });
      } else if (binding.slotId && resolvedSlotId !== binding.slotId) {
        errors.push({
          code: "SLOT_BINDING_REFERENCE_INVALID",
          path: bindingPath,
          message: `Slot binding "${binding.slotBindingKey}" resolves to "${resolvedSlotId}", not "${binding.slotId}".`
        });
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
