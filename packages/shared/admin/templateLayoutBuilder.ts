import { getPageSizePresetConfig } from "../../shared-schema/pageFrame.types";
import type {
  TemplateLayoutDefinition,
  TemplateLayoutValidationResult,
  TemplatePageLayoutDefinition,
} from "../templates/layoutTypes";
import { validateTemplateLayoutDefinition } from "../templates/layoutTypes";

export const ADMIN_TEMPLATE_BUILDER_PREVIEW_MODES = [
  "sample_content",
  "text_stress_test",
  "image_heavy",
  "minimal_content",
] as const;
export type AdminTemplateBuilderPreviewMode =
  (typeof ADMIN_TEMPLATE_BUILDER_PREVIEW_MODES)[number];

export type AdminTemplateBuilderValidationIssue = {
  code: string;
  message: string;
  path: string;
};

export type AdminTemplateBuilderValidationResult = {
  isValid: boolean;
  errors: AdminTemplateBuilderValidationIssue[];
  warnings: AdminTemplateBuilderValidationIssue[];
  canonicalValidation: TemplateLayoutValidationResult;
};

export type AdminTemplateBuilderPreviewItem = {
  slotId: string;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  label: string;
  text?: string;
  imageFit?: string;
  alignment?: string;
  maxLines?: number;
  locked?: boolean;
  required?: boolean;
  captionSlotId?: string;
  focalPoint?: { x: number; y: number };
};

export type AdminTemplateBuilderPreviewData = {
  pageLayoutId: string;
  sizePreset: string;
  widthPx: number;
  heightPx: number;
  backgroundFill: string;
  items: AdminTemplateBuilderPreviewItem[];
};

export type AdminTemplateLayoutBuilderLoadResponse = {
  templateId: string;
  templateName: string;
  templateStatus: string;
  canManage: boolean;
  draftState: {
    hasUnsavedChanges: boolean;
    lastSavedAt: string | null;
    publishedVersionRef: string | null;
  };
  layouts: Array<{
    pageLayoutId: string;
    name: string;
    description: string | null;
    pageRole: string | null;
    sizePreset: string;
    slotCount: number;
    supportedOrientations: string[];
    supportsReflowMode: boolean;
  }>;
  selectedLayoutId: string | null;
  selectedLayout: TemplatePageLayoutDefinition | null;
  layoutDefinition: TemplateLayoutDefinition;
  builderConfig: {
    coordinateSystem: {
      origin: "top-left";
      units: "px";
      referenceSpace: "canonical_page_space";
      snapToGrid: true;
      gridSize: number;
      storeRoundedValues: true;
      roundingStep: number;
    };
    supportedSlotKinds: string[];
    previewModes: readonly AdminTemplateBuilderPreviewMode[];
    gridSize: number;
  };
  validation: AdminTemplateBuilderValidationResult;
};

export type AdminTemplateLayoutBuilderPreviewResponse = {
  previewMode: AdminTemplateBuilderPreviewMode;
  renderedPreviewRefOrData: AdminTemplateBuilderPreviewData | null;
  warnings: string[];
  generatedAt: string;
};

function textFixture(role: string | undefined, mode: AdminTemplateBuilderPreviewMode) {
  const roleName = (role ?? "text").toLowerCase();
  if (mode === "minimal_content") {
    if (roleName.includes("title")) return "A short title";
    if (roleName.includes("caption")) return "A short caption";
    return "Minimal copy.";
  }
  if (mode === "text_stress_test") {
    if (roleName.includes("title")) {
      return "An intentionally long chapter title to expose sizing and overflow behavior in the preview canvas";
    }
    if (roleName.includes("caption")) {
      return "Caption copy that is deliberately wordy to expose clipping behavior.";
    }
    if (roleName.includes("quote")) {
      return "\"A long pull quote can reveal whether the slot needs shrink-to-fit or stronger constraints.\"";
    }
    return "This is a deliberately long body passage used to stress the preview system. It should make overflow risks visible without relying on runtime storybook content.";
  }
  if (mode === "sample_content") {
    if (roleName.includes("title")) return "Childhood in Monsoon Season";
    if (roleName.includes("caption")) return "Family archive photo";
    if (roleName.includes("quote")) return "\"That day stayed with all of us.\"";
    return "A warm memory about family, place, and a vivid moment that still feels close.";
  }
  return "Image-led editorial copy with concise supporting text.";
}

export function buildAdminTemplateLayoutBuilderValidation(
  layoutDefinition: TemplateLayoutDefinition
): AdminTemplateBuilderValidationResult {
  const canonicalValidation = validateTemplateLayoutDefinition(layoutDefinition, {
    requireDefinition: true,
  });
  const errors: AdminTemplateBuilderValidationIssue[] = canonicalValidation.errors.map((error) => ({
    code: error.code,
    message: error.message,
    path: error.path,
  }));
  const warnings: AdminTemplateBuilderValidationIssue[] = [];

  for (const [layoutIndex, layout] of layoutDefinition.pageLayouts.entries()) {
    const page = getPageSizePresetConfig(layout.sizePreset);
    for (const [slotIndex, slot] of layout.slots.entries()) {
      const basePath = `pageLayouts[${layoutIndex}].slots[${slotIndex}]`;
      if (slot.x < 0 || slot.y < 0) {
        errors.push({
          code: "SLOT_GEOMETRY_BOUNDS_INVALID",
          message: `Slot "${slot.slotId}" cannot start outside the page bounds.`,
          path: basePath,
        });
      }
      if (slot.x + slot.w > page.widthPx || slot.y + slot.h > page.heightPx) {
        warnings.push({
          code: "SLOT_GEOMETRY_OUT_OF_BOUNDS_WARNING",
          message: `Slot "${slot.slotId}" extends beyond the ${layout.sizePreset} page bounds.`,
          path: basePath,
        });
      }
      if (slot.kind === "text" && slot.required && !slot.bindingKey) {
        warnings.push({
          code: "SLOT_BINDING_KEY_RECOMMENDED",
          message: `Required text slot "${slot.slotId}" should define a bindingKey for deterministic population.`,
          path: `${basePath}.bindingKey`,
        });
      }
      if (slot.kind === "image" && slot.required && !slot.bindingKey) {
        warnings.push({
          code: "SLOT_BINDING_KEY_RECOMMENDED",
          message: `Required image slot "${slot.slotId}" should define a bindingKey for deterministic population.`,
          path: `${basePath}.bindingKey`,
        });
      }
      if (slot.captionSlotId) {
        const captionSlot = layout.slots.find((candidate) => candidate.slotId === slot.captionSlotId) ?? null;
        if (!captionSlot) {
          errors.push({
            code: "SLOT_CAPTION_REFERENCE_INVALID",
            message: `Slot "${slot.slotId}" points to a missing caption slot "${slot.captionSlotId}".`,
            path: `${basePath}.captionSlotId`,
          });
        } else if (slot.kind !== "image") {
          errors.push({
            code: "SLOT_CAPTION_REFERENCE_INVALID",
            message: `Only image slots may own a caption slot reference, but "${slot.slotId}" is "${slot.kind}".`,
            path: `${basePath}.captionSlotId`,
          });
        } else if (captionSlot.kind !== "text") {
          errors.push({
            code: "SLOT_CAPTION_REFERENCE_INVALID",
            message: `Caption slot "${slot.captionSlotId}" must be a text slot.`,
            path: `${basePath}.captionSlotId`,
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canonicalValidation,
  };
}

export function buildAdminTemplateLayoutPreview(
  layoutDefinition: TemplateLayoutDefinition,
  pageLayoutId: string,
  previewMode: AdminTemplateBuilderPreviewMode
): AdminTemplateLayoutBuilderPreviewResponse {
  const layout = layoutDefinition.pageLayouts.find((item) => item.pageLayoutId === pageLayoutId) ?? null;
  const generatedAt = new Date().toISOString();
  if (!layout) {
    return {
      previewMode,
      renderedPreviewRefOrData: null,
      warnings: [`Layout "${pageLayoutId}" was not found.`],
      generatedAt,
    };
  }

  const page = getPageSizePresetConfig(layout.sizePreset);
  const warnings: string[] = [];
  const backgroundFill =
    layout.defaultStyles?.backgroundColor ??
    layout.defaultStyles?.fill ??
    "#f7f2e8";
  const items = [...layout.slots]
    .sort((left, right) => left.zIndex - right.zIndex)
    .map((slot) => {
      if (slot.kind === "text") {
        const text = textFixture(slot.role, previewMode);
        if (
          previewMode === "text_stress_test" &&
          slot.overflowBehavior === "clip" &&
          text.length > Math.max(40, Math.floor((slot.w * slot.h) / 120))
        ) {
          warnings.push(`Text slot "${slot.slotId}" may clip in stress preview mode.`);
        }
        return {
          slotId: slot.slotId,
          kind: slot.kind,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          zIndex: slot.zIndex,
          label: slot.bindingKey ?? slot.role ?? slot.slotId,
          text,
          alignment: slot.alignment,
          maxLines: slot.maxLines,
          locked: slot.locked,
          required: slot.required,
        } satisfies AdminTemplateBuilderPreviewItem;
      }

      if (slot.kind === "image") {
        if (previewMode === "minimal_content" && slot.required) {
          warnings.push(`Image slot "${slot.slotId}" is required but preview is using sparse content.`);
        }
        return {
          slotId: slot.slotId,
          kind: slot.kind,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          zIndex: slot.zIndex,
          label: slot.bindingKey ?? slot.role ?? slot.slotId,
          imageFit: slot.imageFit ?? "cover",
          locked: slot.locked,
          required: slot.required,
          captionSlotId: slot.captionSlotId,
          focalPoint: slot.focalPoint,
        } satisfies AdminTemplateBuilderPreviewItem;
      }

      return {
        slotId: slot.slotId,
        kind: slot.kind,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        zIndex: slot.zIndex,
        label: slot.role ?? slot.slotId,
      } satisfies AdminTemplateBuilderPreviewItem;
    });

  return {
    previewMode,
    renderedPreviewRefOrData: {
      pageLayoutId: layout.pageLayoutId,
      sizePreset: layout.sizePreset,
      widthPx: page.widthPx,
      heightPx: page.heightPx,
      backgroundFill,
      items,
    },
    warnings,
    generatedAt,
  };
}

export function buildAdminTemplateLayoutBuilderLoadResponse(input: {
  templateId: string;
  templateName: string;
  templateStatus: string;
  canManage: boolean;
  lastSavedAt: number | null;
  publishedVersionRef: string | null;
  layoutDefinition: TemplateLayoutDefinition;
  selectedLayoutId?: string | null;
}): AdminTemplateLayoutBuilderLoadResponse {
  const selectedLayoutId =
    input.selectedLayoutId ??
    input.layoutDefinition.pageLayouts[0]?.pageLayoutId ??
    null;
  const selectedLayout =
    input.layoutDefinition.pageLayouts.find((layout) => layout.pageLayoutId === selectedLayoutId) ??
    null;

  return {
    templateId: input.templateId,
    templateName: input.templateName,
    templateStatus: input.templateStatus,
    canManage: input.canManage,
    draftState: {
      hasUnsavedChanges: false,
      lastSavedAt: input.lastSavedAt ? new Date(input.lastSavedAt).toISOString() : null,
      publishedVersionRef: input.publishedVersionRef,
    },
    layouts: input.layoutDefinition.pageLayouts.map((layout) => ({
      pageLayoutId: layout.pageLayoutId,
      name: layout.name,
      description: layout.description ?? null,
      pageRole: layout.pageRole ?? null,
      sizePreset: layout.sizePreset,
      slotCount: layout.slots.length,
      supportedOrientations: layout.supportedOrientations,
      supportsReflowMode: Boolean(layout.supportsReflowMode),
    })),
    selectedLayoutId,
    selectedLayout,
    layoutDefinition: input.layoutDefinition,
    builderConfig: {
      coordinateSystem: {
        origin: "top-left",
        units: "px",
        referenceSpace: "canonical_page_space",
        snapToGrid: true,
        gridSize: 4,
        storeRoundedValues: true,
        roundingStep: 1,
      },
      supportedSlotKinds: ["text", "image", "shape", "line", "decorative"],
      previewModes: ADMIN_TEMPLATE_BUILDER_PREVIEW_MODES,
      gridSize: 4,
    },
    validation: buildAdminTemplateLayoutBuilderValidation(input.layoutDefinition),
  };
}
