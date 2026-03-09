export const ADMIN_TEMPLATE_STATUSES = [
  "draft",
  "published",
  "disabled",
  "archived",
] as const;
export type AdminTemplateStatus = (typeof ADMIN_TEMPLATE_STATUSES)[number];

export const ADMIN_TEMPLATE_TYPES = [
  "book_template",
  "cover_template",
  "page_template",
] as const;
export type AdminTemplateType = (typeof ADMIN_TEMPLATE_TYPES)[number];

export const ADMIN_TEMPLATE_VISIBILITIES = [
  "public",
  "alpha_only",
  "internal_only",
  "hidden",
] as const;
export type AdminTemplateVisibility = (typeof ADMIN_TEMPLATE_VISIBILITIES)[number];

export const ADMIN_TEMPLATE_CATEGORIES = [
  "family_story",
  "childhood",
  "wedding",
  "life_journey",
  "memorial",
  "general",
  "custom",
] as const;
export type AdminTemplateCategory = (typeof ADMIN_TEMPLATE_CATEGORIES)[number];

export const ADMIN_TEMPLATE_GUIDED_LEVELS = [
  "guided",
  "semi_guided",
  "advanced",
] as const;
export type AdminTemplateGuidedLevel = (typeof ADMIN_TEMPLATE_GUIDED_LEVELS)[number];

export const ADMIN_TEMPLATE_COMPATIBILITY_FILTERS = [
  "fully_configured",
  "needs_attention",
  "portrait_supported",
  "landscape_supported",
  "reflow_supported",
  "pdf_supported",
] as const;
export type AdminTemplateCompatibilityFilter =
  (typeof ADMIN_TEMPLATE_COMPATIBILITY_FILTERS)[number];

export interface AdminTemplateCompatibility {
  supportsPortrait: boolean | null;
  supportsLandscape: boolean | null;
  supportsReflowMode: boolean | null;
  supportsPdfExport: boolean | null;
  warnings: string[];
}

export interface AdminTemplateUsageSummary {
  totalStorybooks: number;
  activeStorybooks: number;
  canArchiveSafely: boolean;
  warnings: string[];
}

export interface AdminTemplateActionState {
  canPublish: boolean;
  publishErrors: string[];
  canDisable: boolean;
  canArchive: boolean;
  archiveBlockReason: string | null;
  canSetDefault: boolean;
}

export interface AdminTemplateQuestion {
  questionId: string;
  prompt: string;
  helpText: string | null;
  required: boolean;
  inputType: GuidedQuestionInputType | null;
  slotKey: string | null;
}

export interface AdminTemplateSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: AdminTemplateType;
  status: AdminTemplateStatus;
  visibility: AdminTemplateVisibility;
  category: AdminTemplateCategory;
  guidedLevel: AdminTemplateGuidedLevel;
  isDefault: boolean;
  displayOrder: number | null;
  usageCount: number;
  chapterCount: number;
  questionCount: number;
  compatibilityStatus: "configured" | "needs_attention";
  updatedAt: number;
}

export interface AdminTemplateDetail extends AdminTemplateSummary {
  subtitle: string | null;
  compatibility: AdminTemplateCompatibility;
  usageSummary: AdminTemplateUsageSummary;
  actionState: AdminTemplateActionState;
  createdAt: number;
  source: "db" | "seed";
  chapters: {
    chapterKey: string;
    title: string;
    subtitle: string | null;
    questionCount: number;
    questions: AdminTemplateQuestion[];
  }[];
  recentStorybooks: {
    id: string;
    title: string;
    ownerId: string;
    status: string;
    updatedAt: number;
  }[];
}

export interface AdminTemplatesCatalogSummary {
  total: number;
  published: number;
  disabled: number;
  inUse: number;
}

export interface AdminTemplatesListQuery {
  q?: string | null;
  status?: AdminTemplateStatus | null;
  type?: AdminTemplateType | null;
  visibility?: AdminTemplateVisibility | null;
  category?: AdminTemplateCategory | null;
  guidedLevel?: AdminTemplateGuidedLevel | null;
  compatibility?: AdminTemplateCompatibilityFilter | null;
  page?: number | null;
  pageSize?: number | null;
}

export interface AdminTemplatesListResponse {
  items: AdminTemplateSummary[];
  summary: AdminTemplatesCatalogSummary;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface AdminTemplateMutableFields {
  name: string;
  description: string;
  type: AdminTemplateType;
  visibility: AdminTemplateVisibility;
  category: AdminTemplateCategory;
  guidedLevel: AdminTemplateGuidedLevel;
  displayOrder: number | null;
  supportsPortrait: boolean;
  supportsLandscape: boolean;
  supportsReflowMode: boolean;
  supportsPdfExport: boolean;
}

export interface CreateAdminTemplateInput extends AdminTemplateMutableFields {
  slug: string;
}

export type UpdateAdminTemplateQuestionsInput = {
  questionsByChapter: Record<string, AdminTemplateQuestion[]>;
};
export type UpdateAdminTemplateInput = Partial<AdminTemplateMutableFields> &
  Partial<UpdateAdminTemplateQuestionsInput>;

export function normalizeAdminTemplateStatus(
  value: string | null | undefined
): AdminTemplateStatus | null {
  return (ADMIN_TEMPLATE_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as AdminTemplateStatus)
    : null;
}

export function normalizeAdminTemplateType(
  value: string | null | undefined
): AdminTemplateType | null {
  return (ADMIN_TEMPLATE_TYPES as readonly string[]).includes(value ?? "")
    ? (value as AdminTemplateType)
    : null;
}

export function normalizeAdminTemplateVisibility(
  value: string | null | undefined
): AdminTemplateVisibility | null {
  return (ADMIN_TEMPLATE_VISIBILITIES as readonly string[]).includes(value ?? "")
    ? (value as AdminTemplateVisibility)
    : null;
}

export function normalizeAdminTemplateCategory(
  value: string | null | undefined
): AdminTemplateCategory | null {
  return (ADMIN_TEMPLATE_CATEGORIES as readonly string[]).includes(value ?? "")
    ? (value as AdminTemplateCategory)
    : null;
}

export function normalizeAdminTemplateGuidedLevel(
  value: string | null | undefined
): AdminTemplateGuidedLevel | null {
  return (ADMIN_TEMPLATE_GUIDED_LEVELS as readonly string[]).includes(value ?? "")
    ? (value as AdminTemplateGuidedLevel)
    : null;
}

export function normalizeAdminTemplateCompatibilityFilter(
  value: string | null | undefined
): AdminTemplateCompatibilityFilter | null {
  return (ADMIN_TEMPLATE_COMPATIBILITY_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as AdminTemplateCompatibilityFilter)
    : null;
}

export function inferAdminTemplateCategory(input: {
  templateId: string;
  title: string;
}): AdminTemplateCategory {
  const haystack = `${input.templateId} ${input.title}`.toLowerCase();
  if (haystack.includes("child")) return "childhood";
  if (haystack.includes("wedding")) return "wedding";
  if (haystack.includes("memorial")) return "memorial";
  if (haystack.includes("life")) return "life_journey";
  if (haystack.includes("family") || haystack.includes("love")) return "family_story";
  return "general";
}

export function formatAdminTemplateEnumLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function templateMatchesCompatibilityFilter(
  compatibility: Pick<
    AdminTemplateCompatibility,
    "supportsPortrait" | "supportsLandscape" | "supportsReflowMode" | "supportsPdfExport"
  >,
  filter: AdminTemplateCompatibilityFilter | null | undefined
) {
  if (!filter) return true;

  if (filter === "fully_configured") {
    return (
      compatibility.supportsPdfExport === true &&
      compatibility.supportsPortrait !== null &&
      compatibility.supportsLandscape !== null &&
      compatibility.supportsReflowMode !== null
    );
  }

  if (filter === "needs_attention") {
    return (
      compatibility.supportsPdfExport !== true ||
      compatibility.supportsPortrait === null ||
      compatibility.supportsLandscape === null ||
      compatibility.supportsReflowMode === null
    );
  }

  if (filter === "portrait_supported") return compatibility.supportsPortrait === true;
  if (filter === "landscape_supported") return compatibility.supportsLandscape === true;
  if (filter === "reflow_supported") return compatibility.supportsReflowMode === true;
  if (filter === "pdf_supported") return compatibility.supportsPdfExport === true;

  return true;
}

export function normalizeAdminTemplateSlug(value: string | null | undefined) {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
  return normalized;
}

export function validateAdminTemplateMetadataInput(
  input: Partial<CreateAdminTemplateInput>,
  options?: { requireSlug?: boolean }
) {
  const errors: string[] = [];

  if (options?.requireSlug && !normalizeAdminTemplateSlug(input.slug)) {
    errors.push("Slug is required and may only contain lowercase letters, numbers, hyphens, and underscores.");
  }
  if (typeof input.name === "string" && input.name.trim().length === 0) {
    errors.push("Template name is required.");
  }
  if (input.type !== undefined && !normalizeAdminTemplateType(input.type)) {
    errors.push("Template type is invalid.");
  }
  if (input.visibility !== undefined && !normalizeAdminTemplateVisibility(input.visibility)) {
    errors.push("Template visibility is invalid.");
  }
  if (input.category !== undefined && !normalizeAdminTemplateCategory(input.category)) {
    errors.push("Template category is invalid.");
  }
  if (input.guidedLevel !== undefined && !normalizeAdminTemplateGuidedLevel(input.guidedLevel)) {
    errors.push("Guided level is invalid.");
  }
  if (
    input.displayOrder !== undefined &&
    input.displayOrder !== null &&
    (!Number.isInteger(input.displayOrder) || input.displayOrder < 1)
  ) {
    errors.push("Display order must be a positive integer when provided.");
  }

  return { ok: errors.length === 0, errors };
}

export function validateAdminTemplatePublishability(input: {
  slug: string;
  name: string;
  type: AdminTemplateType;
  visibility: AdminTemplateVisibility;
  compatibility: Pick<
    AdminTemplateCompatibility,
    "supportsPortrait" | "supportsLandscape" | "supportsPdfExport"
  >;
  chapterCount: number;
  questionCount: number;
}) {
  const errors: string[] = [];

  if (!normalizeAdminTemplateSlug(input.slug)) {
    errors.push("Slug is required before publication.");
  }
  if (!input.name.trim()) {
    errors.push("Template name is required before publication.");
  }
  if (!normalizeAdminTemplateType(input.type)) {
    errors.push("Template type must be set before publication.");
  }
  if (!normalizeAdminTemplateVisibility(input.visibility)) {
    errors.push("Template visibility must be set before publication.");
  }
  if (input.compatibility.supportsPdfExport !== true) {
    errors.push("PDF export support must be confirmed before publication.");
  }
  if (input.compatibility.supportsPortrait !== true && input.compatibility.supportsLandscape !== true) {
    errors.push("At least one supported orientation must be declared before publication.");
  }
  if (input.chapterCount < 1) {
    errors.push("At least one chapter is required before publication.");
  }
  if (input.questionCount < 1) {
    errors.push("At least one guided prompt is required before publication.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
import type { GuidedQuestionInputType } from "../templates/templateTypes";
