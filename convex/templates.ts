import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./authz";
import { getTemplateSeedById, templateSeedsV1 } from "./templateSeeds";

function starterTextContent(chapterTitle: string) {
  return {
    kind: "starter_text",
    version: 1,
    chapterTitle,
    text:
      `Start with a memory from "${chapterTitle}". Add details, people, places, and a meaningful moment.`
  };
}

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

