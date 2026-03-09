import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import templatesV2Json from "../docs/templates_v2.json";
import type {
  GuidedQuestionInputType,
  GuidedTemplateQuestion,
} from "../packages/shared/templates/templateTypes";
import { coerceTemplateLayoutDefinition, validateTemplateLayoutDefinition, type TemplateLayoutDefinition } from "../packages/shared/templates/layoutTypes";
import { buildDefaultTemplateLayoutDefinition, withDefaultTemplateLayouts } from "../packages/shared/templates/defaultLayoutSeed";
import {
  inferAdminTemplateCategory,
  normalizeAdminTemplateCategory,
  normalizeAdminTemplateCompatibilityFilter,
  normalizeAdminTemplateGuidedLevel,
  normalizeAdminTemplateSlug,
  normalizeAdminTemplateStatus,
  normalizeAdminTemplateType,
  normalizeAdminTemplateVisibility,
  templateMatchesCompatibilityFilter,
  validateAdminTemplateMetadataInput,
  validateAdminTemplatePublishability,
  type AdminTemplateCategory,
  type AdminTemplateDetail,
  type AdminTemplateGuidedLevel,
  type AdminTemplateQuestion,
  type AdminTemplateStatus,
  type AdminTemplateType,
  type AdminTemplateVisibility,
  type AdminTemplatesListResponse,
  type CreateAdminTemplateInput,
  type UpdateAdminTemplateInput,
} from "../packages/shared/admin/templates";

type ConvexCtx = QueryCtx | MutationCtx;

type TemplateSeedLike = {
  templateId: string;
  version: number;
  title: string;
  subtitle: string;
  isActive: boolean;
  chapters: Array<{
    chapterKey: string;
    title: string;
    subtitle?: string;
  }>;
  questionFlow: Record<string, GuidedTemplateQuestion[]>;
  slotMap: Record<string, {
    chapterKey: string;
    questionId: string;
    slotPath: string;
    layoutIdLandscape?: string;
    pageLayoutId?: string;
    slotId?: string;
    bindingKey?: string;
  }>;
} & Partial<TemplateLayoutDefinition>;

type TemplateRow = {
  _id: string;
  templateId: string;
  title: string;
  subtitle: string;
  templateJson: unknown;
  isActive: boolean;
  status?: AdminTemplateStatus;
  visibility?: AdminTemplateVisibility;
  type?: AdminTemplateType;
  category?: AdminTemplateCategory;
  guidedLevel?: AdminTemplateGuidedLevel;
  slug?: string;
  description?: string | null;
  displayOrder?: number | null;
  isDefault?: boolean;
  supportsPortrait?: boolean | null;
  supportsLandscape?: boolean | null;
  supportsReflowMode?: boolean | null;
  supportsPdfExport?: boolean | null;
  archivedAt?: number | null;
  updatedAt?: number;
  createdAt: number;
};

type StorybookRow = {
  _id: string;
  title: string;
  ownerId: string;
  templateId?: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";
  updatedAt: number;
};

type TemplateModel = {
  row: TemplateSeedLike;
  source: "db" | "seed";
  metadata: {
    slug: string;
    description: string | null;
    status: AdminTemplateStatus;
    visibility: AdminTemplateVisibility;
    type: AdminTemplateType;
    category: AdminTemplateCategory;
    guidedLevel: AdminTemplateGuidedLevel;
    isDefault: boolean;
    displayOrder: number | null;
    supportsPortrait: boolean | null;
    supportsLandscape: boolean | null;
    supportsReflowMode: boolean | null;
    supportsPdfExport: boolean | null;
    archivedAt: number | null;
    createdAt: number;
    updatedAt: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeQuestionId(value: string | null | undefined, chapterKey: string, index: number) {
  const normalized = normalizeAdminTemplateSlug(value ?? "");
  return normalized || `${chapterKey}_question_${index + 1}`;
}

function normalizeSlotKey(value: string | null | undefined, chapterKey: string, index: number) {
  const trimmed = (value ?? "").trim();
  if (trimmed) return trimmed;
  return `${chapterKey}.question_${index + 1}`;
}

function normalizeQuestionInputType(value: unknown): GuidedQuestionInputType {
  return value === "text" ? "text" : "textarea";
}

function coerceTemplateSeed(value: unknown): TemplateSeedLike | null {
  if (!isRecord(value)) return null;
  if (typeof value.templateId !== "string") return null;
  if (typeof value.version !== "number") return null;
  if (typeof value.title !== "string") return null;
  if (typeof value.subtitle !== "string") return null;
  if (typeof value.isActive !== "boolean") return null;
  if (!Array.isArray(value.chapters) || !isRecord(value.questionFlow) || !isRecord(value.slotMap)) {
    return null;
  }

  return withDefaultTemplateLayouts({
    templateId: value.templateId,
    version: value.version,
    title: value.title,
    subtitle: value.subtitle,
    isActive: value.isActive,
    chapters: value.chapters
      .filter(isRecord)
      .map((chapter) => ({
        chapterKey: typeof chapter.chapterKey === "string" ? chapter.chapterKey : "unknown",
        title: typeof chapter.title === "string" ? chapter.title : "Untitled chapter",
        subtitle: typeof chapter.subtitle === "string" ? chapter.subtitle : undefined,
      })),
    questionFlow: Object.fromEntries(
      Object.entries(value.questionFlow)
        .filter(([, questions]) => Array.isArray(questions))
        .map(([chapterKey, questions]) => [
          chapterKey,
          (questions as unknown[])
            .filter(isRecord)
            .map((question, index) => ({
              questionId: normalizeQuestionId(
                typeof question.questionId === "string" ? question.questionId : null,
                chapterKey,
                index
              ),
              prompt: typeof question.prompt === "string" ? question.prompt : "New question",
              helpText:
                typeof question.helpText === "string" ? question.helpText : undefined,
              required: typeof question.required === "boolean" ? question.required : false,
              inputType: normalizeQuestionInputType(question.inputType),
              slotKey: normalizeSlotKey(
                typeof question.slotKey === "string" ? question.slotKey : null,
                chapterKey,
                index
              ),
            })),
        ])
    ),
    slotMap: Object.fromEntries(
      Object.entries(value.slotMap)
        .flatMap(([slotKey, slot]) => {
          if (!isRecord(slot)) return [];
          return [[
            slotKey,
            {
              chapterKey:
                typeof slot.chapterKey === "string" ? slot.chapterKey : "unknown",
              questionId:
                typeof slot.questionId === "string" ? slot.questionId : `${slotKey}_question`,
              slotPath: typeof slot.slotPath === "string" ? slot.slotPath : slotKey,
              layoutIdLandscape:
                typeof slot.layoutIdLandscape === "string" ? slot.layoutIdLandscape : undefined,
              pageLayoutId:
                typeof slot.pageLayoutId === "string" ? slot.pageLayoutId : undefined,
              slotId: typeof slot.slotId === "string" ? slot.slotId : undefined,
              bindingKey: typeof slot.bindingKey === "string" ? slot.bindingKey : undefined,
            },
          ]];
        })
    ),
    ...(coerceTemplateLayoutDefinition(value) ?? {}),
  });
}

function getTemplateSeeds() {
  return (Array.isArray(templatesV2Json) ? templatesV2Json : [])
    .map(coerceTemplateSeed)
    .filter((template): template is TemplateSeedLike => Boolean(template));
}

function createSeedMetadata(seed: TemplateSeedLike, displayOrder: number) {
  return {
    slug: normalizeAdminTemplateSlug(seed.templateId),
    description: seed.subtitle,
    status: (seed.isActive ? "published" : "disabled") as AdminTemplateStatus,
    visibility: "public" as AdminTemplateVisibility,
    type: "book_template" as AdminTemplateType,
    category: inferAdminTemplateCategory({
      templateId: seed.templateId,
      title: seed.title,
    }),
    guidedLevel: "guided" as AdminTemplateGuidedLevel,
    isDefault: false,
    displayOrder,
    supportsPortrait: true,
    supportsLandscape: null,
    supportsReflowMode: null,
    supportsPdfExport: true,
    archivedAt: null,
  };
}

function createEmptyTemplateJson(input: { templateId: string; title: string; subtitle: string }): TemplateSeedLike {
  const base = {
    templateId: input.templateId,
    version: 1,
    title: input.title,
    subtitle: input.subtitle,
    isActive: false,
    chapters: [],
    questionFlow: {},
    slotMap: {},
  };
  return {
    ...base,
    ...buildDefaultTemplateLayoutDefinition(base)
  };
}

function questionCountForTemplate(template: TemplateSeedLike) {
  return Object.values(template.questionFlow).reduce((sum, questions) => sum + questions.length, 0);
}

function sanitizeQuestionsForChapter(chapterKey: string, questions: GuidedTemplateQuestion[]) {
  return questions.map((question, index) => ({
    questionId: normalizeQuestionId(question.questionId, chapterKey, index),
    prompt: question.prompt.trim() || `Question ${index + 1}`,
    helpText: question.helpText?.trim() ? question.helpText.trim() : undefined,
    required: question.required,
    inputType: (question.inputType === "text" ? "text" : "textarea") as GuidedQuestionInputType,
    slotKey: normalizeSlotKey(question.slotKey, chapterKey, index),
  })) satisfies GuidedTemplateQuestion[];
}

function sanitizeQuestionsByChapter(
  row: TemplateSeedLike,
  questionsByChapter: Record<string, AdminTemplateQuestion[]>
) {
  return Object.fromEntries(
    row.chapters.map((chapter) => [
      chapter.chapterKey,
      sanitizeQuestionsForChapter(
        chapter.chapterKey,
        (questionsByChapter[chapter.chapterKey] ?? []).map((question) => ({
          ...question,
          helpText: question.helpText ?? undefined,
          inputType: question.inputType ?? "textarea",
          slotKey: question.slotKey ?? undefined,
        }))
      ),
    ])
  ) satisfies TemplateSeedLike["questionFlow"];
}

function buildSlotMapFromQuestionFlow(questionFlow: TemplateSeedLike["questionFlow"]) {
  return Object.fromEntries(
    Object.entries(questionFlow).flatMap(([chapterKey, questions]) =>
      questions.flatMap((question) => {
        if (!question.slotKey) return [];
        return [[
          question.slotKey,
          {
            chapterKey,
            questionId: question.questionId,
            slotPath: `chapters.${question.slotKey}`,
          },
        ]];
      })
    )
  ) satisfies TemplateSeedLike["slotMap"];
}

function buildUsageSummary(templateId: string, storybooks: StorybookRow[]) {
  const linked = storybooks.filter(
    (storybook) => storybook.templateId === templateId && storybook.status !== "DELETED"
  );
  const active = linked.filter(
    (storybook) => storybook.status === "DRAFT" || storybook.status === "ACTIVE"
  );

  const warnings: string[] = [];
  if (linked.length > 0) {
    warnings.push("Existing storybooks already use this template.");
  }
  if (active.length > 0) {
    warnings.push("Archive is blocked while active storybooks still reference this template.");
  }

  return {
    totalStorybooks: linked.length,
    activeStorybooks: active.length,
    canArchiveSafely: active.length === 0,
    warnings,
  };
}

function buildCompatibilityWarnings(input: {
  supportsLandscape: boolean | null;
  supportsReflowMode: boolean | null;
}) {
  const warnings: string[] = [];
  if (input.supportsLandscape === null) {
    warnings.push("Landscape compatibility is not configured yet.");
  }
  if (input.supportsReflowMode === null) {
    warnings.push("Reflow compatibility is not configured yet.");
  }
  return warnings;
}

function buildTemplateLayoutPublishErrors(row: TemplateSeedLike) {
  const layoutDefinition = coerceTemplateLayoutDefinition(row);
  const validation = validateTemplateLayoutDefinition(layoutDefinition, {
    requireDefinition: row.chapters.length > 0,
    slotBindings: Object.entries(row.slotMap).map(([bindingKey, binding]) => ({
      bindingKey,
      slotBindingKey: binding.bindingKey ?? null,
      pageLayoutId: binding.pageLayoutId ?? null,
      slotId: binding.slotId ?? null,
    }))
  });

  return validation.errors.map((error) => error.message);
}

function buildActionState(model: TemplateModel, storybooks: StorybookRow[]) {
  const usageSummary = buildUsageSummary(model.row.templateId, storybooks);
  const publishability = validateAdminTemplatePublishability({
    slug: model.metadata.slug,
    name: model.row.title,
    type: model.metadata.type,
    visibility: model.metadata.visibility,
    compatibility: {
      supportsPortrait: model.metadata.supportsPortrait,
      supportsLandscape: model.metadata.supportsLandscape,
      supportsPdfExport: model.metadata.supportsPdfExport,
    },
    chapterCount: model.row.chapters.length,
    questionCount: questionCountForTemplate(model.row),
  });
  const layoutPublishErrors = buildTemplateLayoutPublishErrors(model.row);

  let archiveBlockReason: string | null = null;
  if (model.metadata.status === "published") {
    archiveBlockReason = "Disable the template before archiving it.";
  } else if (!usageSummary.canArchiveSafely) {
    archiveBlockReason = "Archive is blocked while active storybooks still use this template.";
  }

  return {
    canPublish:
      model.metadata.status !== "archived" &&
      model.metadata.status !== "published" &&
      publishability.ok &&
      layoutPublishErrors.length === 0,
    publishErrors: [...publishability.errors, ...layoutPublishErrors],
    canDisable: model.metadata.status === "published",
    canArchive: model.metadata.status !== "published" && usageSummary.canArchiveSafely,
    archiveBlockReason,
    canSetDefault: model.metadata.status === "published",
  };
}

function buildTemplateModel(input: {
  row: TemplateSeedLike;
  source: "db" | "seed";
  dbRow: TemplateRow | null;
  displayOrder: number;
}) {
  const seedDefaults = createSeedMetadata(input.row, input.displayOrder);
  const dbRow = input.dbRow;

  return {
    row: input.row,
    source: input.source,
    metadata: {
      slug: dbRow?.slug ?? seedDefaults.slug,
      description: dbRow?.description ?? seedDefaults.description,
      status: dbRow?.status ?? seedDefaults.status,
      visibility: dbRow?.visibility ?? seedDefaults.visibility,
      type: dbRow?.type ?? seedDefaults.type,
      category: dbRow?.category ?? seedDefaults.category,
      guidedLevel: dbRow?.guidedLevel ?? seedDefaults.guidedLevel,
      isDefault: dbRow?.isDefault ?? seedDefaults.isDefault,
      displayOrder: dbRow?.displayOrder ?? seedDefaults.displayOrder,
      supportsPortrait: dbRow?.supportsPortrait ?? seedDefaults.supportsPortrait,
      supportsLandscape: dbRow?.supportsLandscape ?? seedDefaults.supportsLandscape,
      supportsReflowMode: dbRow?.supportsReflowMode ?? seedDefaults.supportsReflowMode,
      supportsPdfExport: dbRow?.supportsPdfExport ?? seedDefaults.supportsPdfExport,
      archivedAt: dbRow?.archivedAt ?? seedDefaults.archivedAt,
      createdAt: dbRow?.createdAt ?? 0,
      updatedAt: dbRow?.updatedAt ?? dbRow?.createdAt ?? 0,
    },
  } satisfies TemplateModel;
}

function toAdminTemplateDetail(model: TemplateModel, storybooks: StorybookRow[]): AdminTemplateDetail {
  const usageSummary = buildUsageSummary(model.row.templateId, storybooks);
  const compatibilityWarnings = buildCompatibilityWarnings({
    supportsLandscape: model.metadata.supportsLandscape,
    supportsReflowMode: model.metadata.supportsReflowMode,
  });
  const actionState = buildActionState(model, storybooks);
  const questionCount = questionCountForTemplate(model.row);

  return {
    id: model.row.templateId,
    slug: model.metadata.slug,
    name: model.row.title,
    description: model.metadata.description,
    subtitle: model.row.subtitle,
    type: model.metadata.type,
    status: model.metadata.status,
    visibility: model.metadata.visibility,
    category: model.metadata.category,
    guidedLevel: model.metadata.guidedLevel,
    isDefault: model.metadata.isDefault,
    displayOrder: model.metadata.displayOrder,
    usageCount: usageSummary.totalStorybooks,
    chapterCount: model.row.chapters.length,
    questionCount,
    compatibilityStatus: compatibilityWarnings.length === 0 ? "configured" : "needs_attention",
    updatedAt: model.metadata.updatedAt,
    createdAt: model.metadata.createdAt,
    source: model.source,
    compatibility: {
      supportsPortrait: model.metadata.supportsPortrait,
      supportsLandscape: model.metadata.supportsLandscape,
      supportsReflowMode: model.metadata.supportsReflowMode,
      supportsPdfExport: model.metadata.supportsPdfExport,
      warnings: compatibilityWarnings,
    },
    usageSummary,
    actionState,
    chapters: model.row.chapters.map((chapter) => ({
      chapterKey: chapter.chapterKey,
      title: chapter.title,
      subtitle: chapter.subtitle ?? null,
      questionCount: model.row.questionFlow[chapter.chapterKey]?.length ?? 0,
      questions: (model.row.questionFlow[chapter.chapterKey] ?? []).map((question) => ({
        questionId: question.questionId,
        prompt: question.prompt,
        helpText: question.helpText ?? null,
        required: question.required,
        inputType: question.inputType ?? null,
        slotKey: question.slotKey ?? null,
      })),
    })),
    recentStorybooks: storybooks
      .filter((storybook) => storybook.templateId === model.row.templateId)
      .filter((storybook) => storybook.status !== "DELETED")
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, 5)
      .map((storybook) => ({
        id: String(storybook._id),
        title: storybook.title,
        ownerId: storybook.ownerId,
        status: storybook.status,
        updatedAt: storybook.updatedAt,
      })),
  };
}

async function loadTemplateRows(ctx: ConvexCtx) {
  return (await ctx.db.query("templates").collect()) as TemplateRow[];
}

async function loadStorybooks(ctx: ConvexCtx) {
  return (await ctx.db.query("storybooks").collect()) as StorybookRow[];
}

async function loadAdminTemplates(ctx: ConvexCtx) {
  const [rows, storybooks] = await Promise.all([loadTemplateRows(ctx), loadStorybooks(ctx)]);
  const seeds = getTemplateSeeds();
  const rowsById = new Map(rows.map((row) => [row.templateId, row]));
  const templates: AdminTemplateDetail[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const seed = coerceTemplateSeed(row.templateJson) ?? seeds.find((item) => item.templateId === row.templateId);
    if (!seed) continue;
    const model = buildTemplateModel({
      row: seed,
      source: "db",
      dbRow: row,
      displayOrder: row.displayOrder ?? templates.length + 1,
    });
    templates.push(toAdminTemplateDetail(model, storybooks));
    seen.add(row.templateId);
  }

  for (const [index, seed] of seeds.entries()) {
    if (seen.has(seed.templateId)) continue;
    const model = buildTemplateModel({
      row: seed,
      source: "seed",
      dbRow: rowsById.get(seed.templateId) ?? null,
      displayOrder: index + 1,
    });
    templates.push(toAdminTemplateDetail(model, storybooks));
  }

  templates.sort((left, right) => {
    const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.name.localeCompare(right.name);
  });

  return templates;
}

async function getExistingTemplateRow(ctx: ConvexCtx, templateId: string) {
  return (await ctx.db
    .query("templates")
    .withIndex("by_templateId", (q) => q.eq("templateId", templateId))
    .unique()) as TemplateRow | null;
}

async function ensureTemplateRowForMutation(ctx: MutationCtx, templateId: string) {
  const existing = await getExistingTemplateRow(ctx, templateId);
  if (existing) return existing;

  const seeds = getTemplateSeeds();
  const seed = seeds.find((item) => item.templateId === templateId);
  if (!seed) return null;

  const now = Date.now();
  const metadata = createSeedMetadata(seed, seeds.findIndex((item) => item.templateId === templateId) + 1);
  const id = await ctx.db.insert("templates", {
    templateId: seed.templateId,
    title: seed.title,
    subtitle: seed.subtitle,
    templateJson: seed,
    isActive: seed.isActive,
    ...metadata,
    updatedAt: now,
    createdAt: now,
  });
  return (await ctx.db.get(id)) as TemplateRow | null;
}

async function slugExists(
  ctx: ConvexCtx,
  slug: string,
  options?: { excludeTemplateId?: string }
) {
  const normalized = normalizeAdminTemplateSlug(slug);
  const rows = await loadTemplateRows(ctx);
  const rowConflict = rows.some((row) => {
    if (row.templateId === options?.excludeTemplateId) return false;
    return normalizeAdminTemplateSlug(row.slug ?? row.templateId) === normalized;
  });
  if (rowConflict) return true;

  return getTemplateSeeds().some((seed) => {
    if (seed.templateId === options?.excludeTemplateId) return false;
    return normalizeAdminTemplateSlug(seed.templateId) === normalized;
  });
}

function buildPatchedTemplateJson(row: TemplateSeedLike, patch: UpdateAdminTemplateInput | CreateAdminTemplateInput) {
  const title = typeof patch.name === "string" ? patch.name.trim() : row.title;
  const subtitle =
    typeof patch.description === "string" ? patch.description.trim() : row.subtitle;
  const questionFlow =
    "questionsByChapter" in patch && patch.questionsByChapter
    ? sanitizeQuestionsByChapter(row, patch.questionsByChapter)
    : row.questionFlow;

  return withDefaultTemplateLayouts({
    ...row,
    title,
    subtitle,
    questionFlow,
    slotMap: buildSlotMapFromQuestionFlow(questionFlow),
    isActive: row.isActive,
  });
}

function createMetadataPatch(input: UpdateAdminTemplateInput) {
  return {
    title: input.name?.trim(),
    subtitle: input.description?.trim(),
    description:
      input.description !== undefined
        ? input.description.trim() || null
        : undefined,
    type: input.type,
    visibility: input.visibility,
    category: input.category,
    guidedLevel: input.guidedLevel,
    displayOrder:
      input.displayOrder === undefined ? undefined : input.displayOrder,
    supportsPortrait: input.supportsPortrait,
    supportsLandscape: input.supportsLandscape,
    supportsReflowMode: input.supportsReflowMode,
    supportsPdfExport: input.supportsPdfExport,
  };
}

export const listTemplates = queryGeneric({
  args: {
    q: v.optional(v.string()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    visibility: v.optional(v.string()),
    category: v.optional(v.string()),
    guidedLevel: v.optional(v.string()),
    compatibility: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<AdminTemplatesListResponse> => {
    const templates = await loadAdminTemplates(ctx);
    const q = args.q?.trim().toLowerCase() ?? "";
    const status = normalizeAdminTemplateStatus(args.status);
    const type = normalizeAdminTemplateType(args.type);
    const visibility = normalizeAdminTemplateVisibility(args.visibility);
    const category = normalizeAdminTemplateCategory(args.category);
    const guidedLevel = normalizeAdminTemplateGuidedLevel(args.guidedLevel);
    const compatibility = normalizeAdminTemplateCompatibilityFilter(args.compatibility);
    const page = Math.max(1, args.page ?? 1);
    const pageSize = Math.min(Math.max(1, args.pageSize ?? 25), 100);

    const filtered = templates.filter((template) => {
      if (status && template.status !== status) return false;
      if (type && template.type !== type) return false;
      if (visibility && template.visibility !== visibility) return false;
      if (category && template.category !== category) return false;
      if (guidedLevel && template.guidedLevel !== guidedLevel) return false;
      if (!templateMatchesCompatibilityFilter(template.compatibility, compatibility)) return false;
      if (!q) return true;
      return [template.id, template.name, template.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    const items = filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map(
        ({
          compatibility,
          usageSummary,
          actionState,
          chapters,
          recentStorybooks,
          subtitle,
          createdAt,
          source,
          ...summary
        }) => summary
      );

    return {
      items,
      summary: {
        total: templates.length,
        published: templates.filter((template) => template.status === "published").length,
        disabled: templates.filter((template) => template.status === "disabled").length,
        inUse: templates.filter((template) => template.usageCount > 0).length,
      },
      pagination: {
        page,
        pageSize,
        total: filtered.length,
      },
    };
  },
});

export const getTemplateDetail = queryGeneric({
  args: { templateId: v.string() },
  handler: async (ctx, args): Promise<AdminTemplateDetail | null> => {
    const templates = await loadAdminTemplates(ctx);
    return templates.find((template) => template.id === args.templateId) ?? null;
  },
});

export const getTemplateLayouts = queryGeneric({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const row = await getExistingTemplateRow(ctx, args.templateId);
    const seed = getTemplateSeeds().find((item) => item.templateId === args.templateId) ?? null;
    if (!row && !seed) return null;

    const template = row
      ? (coerceTemplateSeed(row.templateJson) ?? createEmptyTemplateJson({
        templateId: row.templateId,
        title: row.title,
        subtitle: row.subtitle,
      }))
      : seed!;
    const layoutDefinition = coerceTemplateLayoutDefinition(template) ?? buildDefaultTemplateLayoutDefinition(template);
    const validation = validateTemplateLayoutDefinition(layoutDefinition, {
      requireDefinition: template.chapters.length > 0,
      slotBindings: Object.entries(template.slotMap).map(([bindingKey, binding]) => ({
        bindingKey,
        slotBindingKey: binding.bindingKey ?? null,
        pageLayoutId: binding.pageLayoutId ?? null,
        slotId: binding.slotId ?? null,
      }))
    });

    return {
      templateId: row?.templateId ?? seed!.templateId,
      layoutDefinition,
      validation
    };
  }
});

export const validateTemplateLayouts = mutationGeneric({
  args: {
    templateId: v.string(),
    layoutDefinition: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const row = await ensureTemplateRowForMutation(ctx, args.templateId);
    if (!row) {
      return { ok: false, code: "NOT_FOUND", errors: ["Template not found."] };
    }

    const template = coerceTemplateSeed(row.templateJson) ?? createEmptyTemplateJson({
      templateId: row.templateId,
      title: row.title,
      subtitle: row.subtitle,
    });
    const candidateLayoutDefinition =
      (args.layoutDefinition ? coerceTemplateLayoutDefinition(args.layoutDefinition) : null) ??
      coerceTemplateLayoutDefinition(template);
    const validation = validateTemplateLayoutDefinition(candidateLayoutDefinition, {
      requireDefinition: template.chapters.length > 0,
      slotBindings: Object.entries(template.slotMap).map(([bindingKey, binding]) => ({
        bindingKey,
        slotBindingKey: binding.bindingKey ?? null,
        pageLayoutId: binding.pageLayoutId ?? null,
        slotId: binding.slotId ?? null,
      }))
    });

    return {
      ok: validation.ok,
      validation,
      errors: validation.errors.map((error) => error.message)
    };
  }
});

export const updateTemplateLayouts = mutationGeneric({
  args: {
    templateId: v.string(),
    layoutDefinition: v.any()
  },
  handler: async (ctx, args) => {
    const row = await ensureTemplateRowForMutation(ctx, args.templateId);
    if (!row) {
      return { ok: false, code: "NOT_FOUND", errors: ["Template not found."] };
    }

    const template = coerceTemplateSeed(row.templateJson) ?? createEmptyTemplateJson({
      templateId: row.templateId,
      title: row.title,
      subtitle: row.subtitle,
    });
    const layoutDefinition = coerceTemplateLayoutDefinition(args.layoutDefinition);
    if (!layoutDefinition) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        errors: ["Layout payload is invalid or incomplete."]
      };
    }

    const validation = validateTemplateLayoutDefinition(layoutDefinition, {
      requireDefinition: template.chapters.length > 0,
      slotBindings: Object.entries(template.slotMap).map(([bindingKey, binding]) => ({
        bindingKey,
        slotBindingKey: binding.bindingKey ?? null,
        pageLayoutId: binding.pageLayoutId ?? null,
        slotId: binding.slotId ?? null,
      }))
    });
    if (!validation.ok) {
      return {
        ok: false,
        code: "LAYOUT_VALIDATION_FAILED",
        errors: validation.errors.map((error) => error.message),
        validation
      };
    }

    await ctx.db.patch(row._id as never, {
      templateJson: {
        ...template,
        ...layoutDefinition
      },
      updatedAt: Date.now()
    });

    return { ok: true, validation };
  }
});

export const createTemplateMetadata = mutationGeneric({
  args: {
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    type: v.string(),
    visibility: v.string(),
    category: v.string(),
    guidedLevel: v.string(),
    displayOrder: v.optional(v.union(v.number(), v.null())),
    supportsPortrait: v.boolean(),
    supportsLandscape: v.boolean(),
    supportsReflowMode: v.boolean(),
    supportsPdfExport: v.boolean(),
  },
  handler: async (ctx, args) => {
    const normalizedSlug = normalizeAdminTemplateSlug(args.slug);
    const type = normalizeAdminTemplateType(args.type);
    const visibility = normalizeAdminTemplateVisibility(args.visibility);
    const category = normalizeAdminTemplateCategory(args.category);
    const guidedLevel = normalizeAdminTemplateGuidedLevel(args.guidedLevel);
    const metadataValidation = validateAdminTemplateMetadataInput({
      ...args,
      slug: normalizedSlug,
      type: type ?? undefined,
      visibility: visibility ?? undefined,
      category: category ?? undefined,
      guidedLevel: guidedLevel ?? undefined,
    }, {
      requireSlug: true,
    });
    if (!metadataValidation.ok) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        errors: metadataValidation.errors,
      };
    }
    if (await slugExists(ctx, normalizedSlug)) {
      return {
        ok: false,
        code: "SLUG_NOT_UNIQUE",
        errors: ["Template slug must be unique."],
      };
    }
    if (!type || !visibility || !category || !guidedLevel) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        errors: ["Template metadata is invalid."],
      };
    }
    const now = Date.now();
    const currentTemplates = await loadAdminTemplates(ctx);
    const displayOrder = args.displayOrder ?? currentTemplates.length + 1;
    const templateJson = createEmptyTemplateJson({
      templateId: normalizedSlug,
      title: args.name.trim(),
      subtitle: args.description.trim(),
    });

    const id = await ctx.db.insert("templates", {
      templateId: normalizedSlug,
      title: args.name.trim(),
      subtitle: args.description.trim(),
      templateJson,
      isActive: false,
      slug: normalizedSlug,
      description: args.description.trim() || null,
      status: "draft",
      visibility,
      type,
      category,
      guidedLevel,
      displayOrder,
      isDefault: false,
      supportsPortrait: args.supportsPortrait,
      supportsLandscape: args.supportsLandscape,
      supportsReflowMode: args.supportsReflowMode,
      supportsPdfExport: args.supportsPdfExport,
      archivedAt: null,
      updatedAt: now,
      createdAt: now,
    });

    return {
      ok: true,
      templateId: normalizedSlug,
      rowId: String(id),
    };
  },
});

export const updateTemplateMetadata = mutationGeneric({
  args: {
    templateId: v.string(),
    patch: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      type: v.optional(v.string()),
      visibility: v.optional(v.string()),
      category: v.optional(v.string()),
      guidedLevel: v.optional(v.string()),
      displayOrder: v.optional(v.union(v.number(), v.null())),
      supportsPortrait: v.optional(v.boolean()),
      supportsLandscape: v.optional(v.boolean()),
      supportsReflowMode: v.optional(v.boolean()),
      supportsPdfExport: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const normalizedPatch = {
      ...args.patch,
      type: args.patch.type ? normalizeAdminTemplateType(args.patch.type) ?? undefined : undefined,
      visibility: args.patch.visibility
        ? normalizeAdminTemplateVisibility(args.patch.visibility) ?? undefined
        : undefined,
      category: args.patch.category
        ? normalizeAdminTemplateCategory(args.patch.category) ?? undefined
        : undefined,
      guidedLevel: args.patch.guidedLevel
        ? normalizeAdminTemplateGuidedLevel(args.patch.guidedLevel) ?? undefined
        : undefined,
    };
    const metadataValidation = validateAdminTemplateMetadataInput(normalizedPatch);
    if (!metadataValidation.ok) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        errors: metadataValidation.errors,
      };
    }

    const row = await ensureTemplateRowForMutation(ctx, args.templateId);
    if (!row) {
      return {
        ok: false,
        code: "NOT_FOUND",
        errors: ["Template not found."],
      };
    }

    const template = coerceTemplateSeed(row.templateJson) ?? createEmptyTemplateJson({
      templateId: row.templateId,
      title: row.title,
      subtitle: row.subtitle,
    });
    const patch = createMetadataPatch(normalizedPatch);
    const nextTemplateJson = buildPatchedTemplateJson(template, normalizedPatch);
    const nextName = patch.title ?? row.title;
    const nextSubtitle = patch.subtitle ?? row.subtitle;
    const metadataPatch: Record<string, unknown> = {
      title: nextName,
      subtitle: nextSubtitle,
      templateJson: {
        ...nextTemplateJson,
        templateId: row.templateId,
        isActive: row.isActive,
      },
      updatedAt: Date.now(),
    };

    if (patch.description !== undefined) metadataPatch.description = patch.description;
    if (patch.type !== undefined) metadataPatch.type = patch.type;
    if (patch.visibility !== undefined) metadataPatch.visibility = patch.visibility;
    if (patch.category !== undefined) metadataPatch.category = patch.category;
    if (patch.guidedLevel !== undefined) metadataPatch.guidedLevel = patch.guidedLevel;
    if (patch.displayOrder !== undefined) metadataPatch.displayOrder = patch.displayOrder;
    if (patch.supportsPortrait !== undefined) metadataPatch.supportsPortrait = patch.supportsPortrait;
    if (patch.supportsLandscape !== undefined) metadataPatch.supportsLandscape = patch.supportsLandscape;
    if (patch.supportsReflowMode !== undefined) metadataPatch.supportsReflowMode = patch.supportsReflowMode;
    if (patch.supportsPdfExport !== undefined) metadataPatch.supportsPdfExport = patch.supportsPdfExport;

    await ctx.db.patch(row._id as never, metadataPatch as never);

    return { ok: true };
  },
});

export const publishTemplate = mutationGeneric({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const row = await ensureTemplateRowForMutation(ctx, args.templateId);
    if (!row) {
      return { ok: false, code: "NOT_FOUND", errors: ["Template not found."] };
    }

    const storybooks = await loadStorybooks(ctx);
    const template = coerceTemplateSeed(row.templateJson) ?? createEmptyTemplateJson({
      templateId: row.templateId,
      title: row.title,
      subtitle: row.subtitle,
    });
    const model = buildTemplateModel({
      row: template,
      source: "db",
      dbRow: row,
      displayOrder: row.displayOrder ?? 1,
    });
    const detail = toAdminTemplateDetail(model, storybooks);

    if (!detail.actionState.canPublish) {
      return {
        ok: false,
        code: "TEMPLATE_VALIDATION_FAILED",
        errors: detail.actionState.publishErrors,
      };
    }

    await ctx.db.patch(row._id as never, {
      status: "published",
      isActive: true,
      archivedAt: null,
      updatedAt: Date.now(),
      templateJson: {
        ...template,
        isActive: true,
      },
    });

    return { ok: true };
  },
});

export const disableTemplate = mutationGeneric({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const row = await ensureTemplateRowForMutation(ctx, args.templateId);
    if (!row) {
      return { ok: false, code: "NOT_FOUND", errors: ["Template not found."] };
    }

    const template = coerceTemplateSeed(row.templateJson) ?? createEmptyTemplateJson({
      templateId: row.templateId,
      title: row.title,
      subtitle: row.subtitle,
    });

    await ctx.db.patch(row._id as never, {
      status: "disabled",
      isActive: false,
      updatedAt: Date.now(),
      templateJson: {
        ...template,
        isActive: false,
      },
    });

    return { ok: true };
  },
});

export const archiveTemplate = mutationGeneric({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const row = await ensureTemplateRowForMutation(ctx, args.templateId);
    if (!row) {
      return { ok: false, code: "NOT_FOUND", errors: ["Template not found."] };
    }

    const storybooks = await loadStorybooks(ctx);
    const template = coerceTemplateSeed(row.templateJson) ?? createEmptyTemplateJson({
      templateId: row.templateId,
      title: row.title,
      subtitle: row.subtitle,
    });
    const model = buildTemplateModel({
      row: template,
      source: "db",
      dbRow: row,
      displayOrder: row.displayOrder ?? 1,
    });
    const detail = toAdminTemplateDetail(model, storybooks);

    if (detail.status === "published") {
      return {
        ok: false,
        code: "REQUIRE_DISABLE_FIRST",
        errors: ["Disable the template before archiving it."],
      };
    }

    if (!detail.usageSummary.canArchiveSafely) {
      return {
        ok: false,
        code: "TEMPLATE_IN_USE",
        errors: ["Active storybooks still use this template."],
      };
    }

    await ctx.db.patch(row._id as never, {
      status: "archived",
      isActive: false,
      isDefault: false,
      archivedAt: Date.now(),
      updatedAt: Date.now(),
      templateJson: {
        ...template,
        isActive: false,
      },
    });

    return { ok: true };
  },
});

export const setDefaultTemplate = mutationGeneric({
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const row = await ensureTemplateRowForMutation(ctx, args.templateId);
    if (!row) {
      return { ok: false, code: "NOT_FOUND", errors: ["Template not found."] };
    }

    const templates = await loadAdminTemplates(ctx);
    const target = templates.find((template) => template.id === args.templateId);
    if (!target) {
      return { ok: false, code: "NOT_FOUND", errors: ["Template not found."] };
    }
    if (!target.actionState.canSetDefault) {
      return {
        ok: false,
        code: "DEFAULT_NOT_ALLOWED",
        errors: ["Only published templates can be set as default."],
      };
    }

    const rows = await loadTemplateRows(ctx);
    const now = Date.now();
    for (const candidate of rows) {
      const candidateType = candidate.type ?? "book_template";
      const candidateCategory =
        candidate.category ??
        inferAdminTemplateCategory({
          templateId: candidate.templateId,
          title: candidate.title,
        });

      if (candidateType === target.type && candidateCategory === target.category && candidate.isDefault) {
        await ctx.db.patch(candidate._id as never, { isDefault: false, updatedAt: now });
      }
    }

    await ctx.db.patch(row._id as never, {
      isDefault: true,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const reorderTemplates = mutationGeneric({
  args: {
    items: v.array(
      v.object({
        templateId: v.string(),
        displayOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = new Set<string>();
    const orders = new Set<number>();

    for (const item of args.items) {
      if (item.displayOrder < 1 || !Number.isInteger(item.displayOrder)) {
        return {
          ok: false,
          code: "BAD_REQUEST",
          errors: ["Display order must be a positive integer."],
        };
      }
      if (ids.has(item.templateId) || orders.has(item.displayOrder)) {
        return {
          ok: false,
          code: "BAD_REQUEST",
          errors: ["Template ids and display orders must be unique."],
        };
      }
      ids.add(item.templateId);
      orders.add(item.displayOrder);
    }

    for (const item of args.items) {
      const row = await ensureTemplateRowForMutation(ctx, item.templateId);
      if (!row) {
        return {
          ok: false,
          code: "NOT_FOUND",
          errors: [`Template ${item.templateId} was not found.`],
        };
      }
      await ctx.db.patch(row._id as never, {
        displayOrder: item.displayOrder,
        updatedAt: Date.now(),
      });
    }

    return { ok: true, count: args.items.length };
  },
});
