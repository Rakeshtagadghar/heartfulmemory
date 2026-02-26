import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./authz";
import { getTemplateSeedById, templateSeedsV1 } from "./templateSeeds";
import templatesV2Json from "../docs/templates_v2.json";
import type {
  GuidedTemplateQuestion,
  GuidedTemplateSummary,
  GuidedTemplateV2
} from "../packages/shared/templates/templateTypes";

type ConvexCtx = MutationCtx | QueryCtx;

const templateSeedsV2 = templatesV2Json as GuidedTemplateV2[];

function starterTextContent(chapterTitle: string) {
  return {
    kind: "starter_text",
    version: 1,
    chapterTitle,
    text:
      `Start with a memory from "${chapterTitle}". Add details, people, places, and a meaningful moment.`
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceQuestion(value: unknown): GuidedTemplateQuestion | null {
  if (!isRecord(value)) return null;
  if (typeof value.questionId !== "string") return null;
  if (typeof value.prompt !== "string") return null;
  if (typeof value.required !== "boolean") return null;
  return {
    questionId: value.questionId,
    prompt: value.prompt,
    required: value.required,
    helpText: typeof value.helpText === "string" ? value.helpText : undefined,
    inputType: value.inputType === "text" || value.inputType === "textarea" ? value.inputType : undefined,
    slotKey: typeof value.slotKey === "string" ? value.slotKey : undefined
  };
}

function coerceTemplateV2(value: unknown): GuidedTemplateV2 | null {
  if (!isRecord(value)) return null;
  if (typeof value.templateId !== "string") return null;
  if (typeof value.version !== "number") return null;
  if (typeof value.title !== "string") return null;
  if (typeof value.subtitle !== "string") return null;
  if (typeof value.isActive !== "boolean") return null;
  if (!Array.isArray(value.chapters)) return null;
  if (!isRecord(value.questionFlow) || !isRecord(value.slotMap)) return null;

  const chapters = value.chapters
    .map((chapter) => {
      if (!isRecord(chapter)) return null;
      if (typeof chapter.chapterKey !== "string" || typeof chapter.title !== "string") return null;
      return {
        chapterKey: chapter.chapterKey,
        title: chapter.title,
        subtitle: typeof chapter.subtitle === "string" ? chapter.subtitle : undefined
      };
    })
    .filter(Boolean) as GuidedTemplateV2["chapters"];

  const questionFlow: GuidedTemplateV2["questionFlow"] = {};
  for (const [chapterKey, questions] of Object.entries(value.questionFlow)) {
    if (!Array.isArray(questions)) continue;
    questionFlow[chapterKey] = questions.map(coerceQuestion).filter(Boolean) as GuidedTemplateQuestion[];
  }

  const slotMap: GuidedTemplateV2["slotMap"] = {};
  for (const [slotKey, binding] of Object.entries(value.slotMap)) {
    if (!isRecord(binding)) continue;
    if (
      typeof binding.chapterKey !== "string" ||
      typeof binding.questionId !== "string" ||
      typeof binding.slotPath !== "string"
    ) {
      continue;
    }
    slotMap[slotKey] = {
      chapterKey: binding.chapterKey,
      questionId: binding.questionId,
      slotPath: binding.slotPath
    };
  }

  return {
    templateId: value.templateId,
    version: value.version,
    title: value.title,
    subtitle: value.subtitle,
    isActive: value.isActive,
    chapters,
    questionFlow,
    slotMap
  };
}

function toTemplateSummary(template: GuidedTemplateV2): GuidedTemplateSummary {
  return {
    templateId: template.templateId,
    version: template.version,
    title: template.title,
    subtitle: template.subtitle,
    isActive: template.isActive,
    chapters: template.chapters
  };
}

function normalizeTemplateList(values: unknown[]): GuidedTemplateV2[] {
  return values
    .map(coerceTemplateV2)
    .filter((template): template is GuidedTemplateV2 => Boolean(template));
}

export function getTemplateV2SeedById(templateId: string) {
  return templateSeedsV2.find((template) => template.templateId === templateId) ?? null;
}

export async function loadTemplateV2ByIdFromDbOrSeed(ctx: ConvexCtx, templateId: string) {
  const row = await ctx.db
    .query("templates")
    .withIndex("by_templateId", (q) => q.eq("templateId", templateId))
    .unique();

  if (row) {
    return coerceTemplateV2(row.templateJson) ?? getTemplateV2SeedById(templateId);
  }

  return getTemplateV2SeedById(templateId);
}

export function getTemplateQuestionsForChapter(template: GuidedTemplateV2, chapterKey: string) {
  return template.questionFlow[chapterKey] ?? [];
}

export const getActive = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("templates")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const dbTemplates = normalizeTemplateList(rows.map((row) => row.templateJson));
    const source = dbTemplates.length > 0 ? dbTemplates : templateSeedsV2.filter((template) => template.isActive);

    return source.map((template) => ({
      ...toTemplateSummary(template),
      chapterCount: template.chapters.length
    }));
  }
});

export const getById = queryGeneric({
  args: {
    templateId: v.string()
  },
  handler: async (ctx, args) => {
    const template = await loadTemplateV2ByIdFromDbOrSeed(ctx, args.templateId);
    if (!template) return null;
    return template;
  }
});

export const seedV2 = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    if (!(viewer.subject.startsWith("dev:") || viewer.subject.includes("@"))) {
      throw new Error("Forbidden");
    }

    let inserted = 0;
    let updated = 0;
    for (const seed of templateSeedsV2) {
      const existing = await ctx.db
        .query("templates")
        .withIndex("by_templateId", (q) => q.eq("templateId", seed.templateId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: seed.title,
          subtitle: seed.subtitle,
          templateJson: seed,
          isActive: seed.isActive
        });
        updated += 1;
        continue;
      }

      await ctx.db.insert("templates", {
        templateId: seed.templateId,
        title: seed.title,
        subtitle: seed.subtitle,
        templateJson: seed,
        isActive: seed.isActive,
        createdAt: Date.now()
      });
      inserted += 1;
    }

    return { ok: true, inserted, updated, total: templateSeedsV2.length };
  }
});

export const list = queryGeneric({
  args: {},
  handler: async () =>
    templateSeedsV1.map((template) => ({
      templateId: template.templateId,
      templateVersion: template.templateVersion,
      name: template.name,
      chapters: [...template.chapters]
    }))
});

export const apply = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    templateId: v.string()
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const template = getTemplateSeedById(args.templateId);
    if (!template) throw new Error("Unknown template");

    const now = Date.now();
    const storybookId = await ctx.db.insert("storybooks", {
      ownerId: viewer.subject,
      title: template.name,
      templateId: template.templateId,
      bookMode: "DIGITAL",
      status: "DRAFT",
      settings: {
        templateId: template.templateId,
        templateVersion: template.templateVersion
      },
      createdAt: now,
      updatedAt: now
    });

    for (const [chapterIndex, chapterTitle] of template.chapters.entries()) {
      const chapterId = await ctx.db.insert("chapters", {
        storybookId,
        ownerId: viewer.subject,
        title: chapterTitle,
        status: "DRAFT",
        orderIndex: chapterIndex,
        createdAt: now,
        updatedAt: now
      });

      await ctx.db.insert("chapterBlocks", {
        storybookId,
        chapterId,
        ownerId: viewer.subject,
        type: "TEXT",
        orderIndex: 0,
        content: starterTextContent(chapterTitle),
        version: 1,
        createdAt: now,
        updatedAt: now
      });
    }

    return {
      storybookId: String(storybookId),
      templateId: template.templateId,
      templateVersion: template.templateVersion
    };
  }
});
