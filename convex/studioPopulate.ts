"use node";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { mapDraftToTextSlots } from "../packages/shared/populate/textSlotMapper";
import { mapIllustrationsToImageSlots } from "../packages/shared/populate/imageSlotMapper";
import { buildFillSlotWithImagePatch } from "../packages/editor/commands/fillSlotWithImage";

type PageDto = {
  id: string;
  order_index: number;
  width_px: number;
  height_px: number;
};

type FrameDto = {
  id: string;
  page_id: string;
  type: "TEXT" | "IMAGE" | "SHAPE" | "LINE" | "FRAME" | "GROUP";
  x: number;
  y: number;
  w: number;
  h: number;
  z_index: number;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
  crop: Record<string, unknown> | null;
  version: number;
};

type TextSlotSpec = {
  slotId: string;
  kind: "text";
  role: "title" | "subtitle" | "body" | "quote" | "caption";
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
};

type ImageSlotSpec = {
  slotId: string;
  kind: "image";
  frameType: "IMAGE" | "FRAME";
  captionSlotId?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
};

type SlotSpec = TextSlotSpec | ImageSlotSpec;

type ChapterPageSpec = {
  pageTemplateId: string;
  slots: SlotSpec[];
};

function recordOrNull(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function inferTextRole(slotId: string): TextSlotSpec["role"] {
  const lower = slotId.toLowerCase();
  if (lower.includes("subtitle")) return "subtitle";
  if (lower.includes("quote") || lower.includes("pull")) return "quote";
  if (lower.includes("caption")) return "caption";
  if (lower.includes("body") || lower.includes("main") || lower.includes("text")) return "body";
  return "title";
}

function inferSlotKind(slot: Record<string, unknown>): "text" | "image" | null {
  const candidates = [slot.kind, slot.type, slot.role, slot.slotId, slot.id]
    .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
    .filter(Boolean);
  if (candidates.some((value) => value.includes("image"))) return "image";
  if (candidates.some((value) => value.includes("text") || value.includes("title") || value.includes("caption") || value.includes("quote"))) {
    return "text";
  }
  return null;
}

function fallbackChapterPageSpecs(_chapterKey: string): ChapterPageSpec[] {
  return [
    {
      pageTemplateId: "chapter_main_v1",
      slots: [
        { slotId: "title", kind: "text", role: "title", x: 60, y: 64, w: 696, h: 72, zIndex: 1 },
        { slotId: "image1", kind: "image", frameType: "FRAME", captionSlotId: "caption1", x: 60, y: 156, w: 470, h: 320, zIndex: 2 },
        { slotId: "body", kind: "text", role: "body", x: 552, y: 156, w: 204, h: 320, zIndex: 3 },
        { slotId: "quote", kind: "text", role: "quote", x: 60, y: 498, w: 696, h: 86, zIndex: 4 },
        { slotId: "caption1", kind: "text", role: "caption", x: 60, y: 484, w: 470, h: 20, zIndex: 5 },
        { slotId: "image2", kind: "image", frameType: "IMAGE", captionSlotId: "caption2", x: 60, y: 624, w: 332, h: 240, zIndex: 6 },
        { slotId: "image3", kind: "image", frameType: "IMAGE", captionSlotId: "caption3", x: 424, y: 624, w: 332, h: 240, zIndex: 7 },
        { slotId: "caption2", kind: "text", role: "caption", x: 60, y: 872, w: 332, h: 26, zIndex: 8 },
        { slotId: "caption3", kind: "text", role: "caption", x: 424, y: 872, w: 332, h: 26, zIndex: 9 }
      ]
    }
  ];
}

function extractChapterPageSpecs(templateJson: unknown, chapterKey: string): ChapterPageSpec[] {
  const template = recordOrNull(templateJson);
  const studioPages = Array.isArray(template?.studioPages) ? template.studioPages : [];
  const chapterPages = studioPages.filter((page) => recordOrNull(page)?.chapterKey === chapterKey);
  const parsed: ChapterPageSpec[] = [];

  for (const page of chapterPages) {
    const pageRecord = recordOrNull(page);
    if (!pageRecord) continue;
    const slotsRaw = Array.isArray(pageRecord.slots) ? pageRecord.slots : [];
    const slots: SlotSpec[] = [];
    let slotIndex = 0;
    for (const slotValue of slotsRaw) {
      const slot = recordOrNull(slotValue);
      if (!slot) continue;
      const slotKind = inferSlotKind(slot);
      if (!slotKind) continue;
      const slotId = stringValue(slot.slotId) ?? stringValue(slot.id) ?? `${slotKind}${slotIndex + 1}`;
      const x = numberValue(slot.x) ?? (slotKind === "image" ? 60 + slotIndex * 32 : 60);
      const y = numberValue(slot.y) ?? (slotKind === "image" ? 180 + slotIndex * 20 : 80 + slotIndex * 40);
      const w = Math.max(40, numberValue(slot.w) ?? (slotKind === "image" ? 300 : 600));
      const h = Math.max(40, numberValue(slot.h) ?? (slotKind === "image" ? 220 : 100));
      const zIndex = Math.max(1, numberValue(slot.zIndex) ?? slotIndex + 1);

      if (slotKind === "text") {
        slots.push({
          slotId,
          kind: "text",
          role: inferTextRole(slotId),
          x,
          y,
          w,
          h,
          zIndex
        });
      } else {
        const roleString = stringValue(slot.role)?.toLowerCase() ?? "";
        const typeString = stringValue(slot.type)?.toLowerCase() ?? "";
        const frameType: "IMAGE" | "FRAME" =
          roleString.includes("frame") || typeString.includes("frame") ? "FRAME" : "IMAGE";
        slots.push({
          slotId,
          kind: "image",
          frameType,
          x,
          y,
          w,
          h,
          zIndex
        });
      }
      slotIndex += 1;
    }
    if (slots.length > 0) {
      parsed.push({
        pageTemplateId: stringValue(pageRecord.pageTemplateId) ?? stringValue(pageRecord.layoutId) ?? `chapter_page_${parsed.length + 1}`,
        slots
      });
    }
  }

  return parsed.length > 0 ? parsed : fallbackChapterPageSpecs(chapterKey);
}

function stableNodeKey(chapterKey: string, pageTemplateId: string, slotId: string) {
  return `s21:${chapterKey}:${pageTemplateId}:${slotId}`;
}

function populateMetaPatch(chapterKey: string, pageTemplateId: string, slotId: string, kind: "text" | "image") {
  return {
    stableNodeKey: stableNodeKey(chapterKey, pageTemplateId, slotId),
    source: "studio_populate_v1",
    sourceKind: kind,
    chapterKey,
    pageTemplateId,
    slotId
  };
}

function frameTextStyle(role: TextSlotSpec["role"]) {
  if (role === "title") {
    return { fontFamily: "serif", fontSize: 34, lineHeight: 1.12, fontWeight: 700, color: "#1e2430", align: "left" };
  }
  if (role === "subtitle") {
    return { fontFamily: "sans", fontSize: 16, lineHeight: 1.3, fontWeight: 500, color: "#3b465a", align: "left" };
  }
  if (role === "quote") {
    return { fontFamily: "serif", fontSize: 20, lineHeight: 1.25, fontWeight: 500, color: "#2a3141", italic: true, align: "left" };
  }
  if (role === "caption") {
    return { fontFamily: "sans", fontSize: 12, lineHeight: 1.2, fontWeight: 500, color: "#5a6375", align: "left" };
  }
  return { fontFamily: "sans", fontSize: 15, lineHeight: 1.45, fontWeight: 400, color: "#293040", align: "left" };
}

function createTextFrameContent(text: string, meta: Record<string, unknown>) {
  return {
    kind: "text_frame_v1",
    text,
    populateMeta: meta
  };
}

function createImagePlaceholderContent(slotId: string, frameType: "IMAGE" | "FRAME", meta: Record<string, unknown>) {
  if (frameType === "FRAME") {
    return {
      kind: "frame_node_v1",
      placeholderLabel: `Image placeholder (${slotId})`,
      imageRef: null,
      attribution: null,
      populateMeta: meta
    };
  }
  return {
    kind: "image_frame_v1",
    caption: "",
    placeholderLabel: `Image placeholder (${slotId})`,
    attribution: null,
    populateMeta: meta
  };
}

function fingerprintDraft(draft: { version: number; summary: string; sections: Array<{ sectionId: string; wordCount: number }> }) {
  return `d:${draft.version}:${draft.summary.length}:${draft.sections.map((s) => `${s.sectionId}:${s.wordCount}`).join("|")}`;
}

function fingerprintIllustrations(
  illustration: { version: number; slotAssignments: Array<{ slotId: string; mediaAssetId: string }> }
) {
  return `i:${illustration.version}:${illustration.slotAssignments.map((s) => `${s.slotId}:${s.mediaAssetId}`).sort().join("|")}`;
}

async function requireActionUser(ctx: ActionCtx, explicitSubject?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject || identity?.tokenIdentifier || explicitSubject || null;
  if (!subject) throw new Error("Unauthorized");
  return { subject };
}

function firstStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const populateChapter = action({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    try {
      const viewer = await requireActionUser(ctx, args.viewerSubject);
      const [storybook, chapter, draft, illustrationState, studioState] = await Promise.all([
        ctx.runQuery(api.storybooks.getGuidedById, { viewerSubject: viewer.subject, storybookId: args.storybookId }),
        ctx.runQuery(api.storybookChapters.get, { viewerSubject: viewer.subject, chapterInstanceId: args.chapterInstanceId }),
        ctx.runQuery(api.chapterDrafts.getLatestByChapter, { viewerSubject: viewer.subject, chapterInstanceId: args.chapterInstanceId }),
        ctx.runQuery(api.chapterIllustrations.getLatestByChapterInstance, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        }),
        ctx.runQuery(api.chapterStudioState.getByChapterInstance, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        })
      ]);

      const template = storybook.templateId
        ? await ctx.runQuery(api.templates.getById, { templateId: storybook.templateId })
        : null;

      if (!draft || draft.status !== "ready") {
        return { ok: false as const, errorCode: "DRAFT_NOT_READY", message: "Chapter draft is not ready.", retryable: false };
      }
      if (!illustrationState || illustrationState.status !== "ready") {
        return {
          ok: false as const,
          errorCode: "ILLUSTRATIONS_NOT_READY",
          message: "Chapter illustrations are not ready.",
          retryable: false
        };
      }

      if (
        studioState &&
        (studioState.status === "edited" || studioState.status === "finalized") &&
        studioState.pageIds.length > 0
      ) {
        return {
          ok: true as const,
          storybookId: String(args.storybookId),
          chapterInstanceId: String(args.chapterInstanceId),
          chapterKey: chapter.chapterKey,
          pageIds: studioState.pageIds,
          firstPageId: studioState.pageIds[0] ?? null,
          createdNodeIds: [] as string[],
          updatedNodeIds: [] as string[],
          skippedNodeIds: [] as string[],
          reused: true as const,
          skippedBecauseEdited: true as const,
          versions: {
            draftVersion: draft.version,
            illustrationVersion: illustrationState.version
          }
        };
      }

      if (
        studioState &&
        studioState.pageIds.length > 0 &&
        studioState.lastAppliedDraftVersion === draft.version &&
        studioState.lastAppliedIllustrationVersion === illustrationState.version
      ) {
        return {
          ok: true as const,
          storybookId: String(args.storybookId),
          chapterInstanceId: String(args.chapterInstanceId),
          chapterKey: chapter.chapterKey,
          pageIds: studioState.pageIds,
          firstPageId: studioState.pageIds[0] ?? null,
          createdNodeIds: [] as string[],
          updatedNodeIds: [] as string[],
          skippedNodeIds: [] as string[],
          reused: true as const,
          skippedBecauseEdited: false as const,
          versions: {
            draftVersion: draft.version,
            illustrationVersion: illustrationState.version
          }
        };
      }

      const pageSpecs = extractChapterPageSpecs(template?.templateJson ?? template, chapter.chapterKey);
      let pages = await ctx.runQuery(api.pages.listByStorybook, { viewerSubject: viewer.subject, storybookId: args.storybookId });
      const existingPageIds = studioState?.pageIds ?? [];
      const pageIds: string[] = [];

      for (let i = 0; i < pageSpecs.length; i += 1) {
        const existingPageId = existingPageIds[i];
        if (existingPageId && pages.some((page) => String(page.id) === existingPageId)) {
          pageIds.push(existingPageId);
          continue;
        }
        const createdPage = await ctx.runMutation(api.pages.create, {
          viewerSubject: viewer.subject,
          storybookId: args.storybookId
        });
        pageIds.push(String(createdPage.id));
        pages = await ctx.runQuery(api.pages.listByStorybook, { viewerSubject: viewer.subject, storybookId: args.storybookId });
      }

      const frames = await ctx.runQuery(api.frames.listByStorybook, { viewerSubject: viewer.subject, storybookId: args.storybookId });
      const framesByPageId = new Map<string, FrameDto[]>();
      for (const frame of frames as FrameDto[]) {
        const list = framesByPageId.get(frame.page_id) ?? [];
        list.push(frame);
        framesByPageId.set(frame.page_id, list);
      }

      const illustrationSlotMap = await ctx.runQuery(api.chapterIllustrations.getByChapterInstance, {
        viewerSubject: viewer.subject,
        chapterInstanceId: args.chapterInstanceId
      });
      const imageSlots = pageSpecs.flatMap((page) => page.slots.filter((slot): slot is ImageSlotSpec => slot.kind === "image"));
      const textSlots = pageSpecs.flatMap((page) => page.slots.filter((slot): slot is TextSlotSpec => slot.kind === "text"));

      const textMapping = mapDraftToTextSlots({
        chapterTitle: chapter.title,
        chapterSubtitle: null,
        draft,
        slotIds: textSlots.map((slot) => slot.slotId)
      });
      const imageMapping = mapIllustrationsToImageSlots({
        slotIds: imageSlots.map((slot) => slot.slotId),
        slotAssets: (illustrationSlotMap?.slots ?? {}) as Record<string, any>
      });

      const createdNodeIds: string[] = [];
      const updatedNodeIds: string[] = [];
      const skippedNodeIds: string[] = [];

      for (const [pageIndex, pageSpec] of pageSpecs.entries()) {
        const pageId = pageIds[pageIndex];
        const page = (pages as PageDto[]).find((row) => row.id === pageId);
        if (!page) continue;
        const pageFrames = [...(framesByPageId.get(pageId) ?? [])].sort((a, b) => a.z_index - b.z_index);

        const byStableKey = new Map<string, FrameDto>();
        for (const frame of pageFrames) {
          const content = recordOrNull(frame.content);
          const meta = recordOrNull(content?.populateMeta);
          const key = stringValue(meta?.stableNodeKey);
          if (key) byStableKey.set(key, frame);
        }

        for (const slot of pageSpec.slots) {
          const meta = populateMetaPatch(chapter.chapterKey, pageSpec.pageTemplateId, slot.slotId, slot.kind);
          const key = String(meta.stableNodeKey);
          const existingFrame = byStableKey.get(key);

          if (slot.kind === "text") {
            const text = textMapping.slotText[slot.slotId] ?? "";
            const content = createTextFrameContent(text, meta);
            if (!existingFrame) {
              const created = await ctx.runMutation(api.frames.create, {
                viewerSubject: viewer.subject,
                pageId: pageId as any,
                type: "TEXT",
                x: slot.x,
                y: slot.y,
                w: slot.w,
                h: slot.h,
                zIndex: slot.zIndex,
                locked: false,
                style: frameTextStyle(slot.role),
                content
              });
              createdNodeIds.push(String(created.id));
              continue;
            }

            const existingContent = recordOrNull(existingFrame.content);
            const existingText = stringValue(existingContent?.text) ?? "";
            if (existingText === text) {
              skippedNodeIds.push(existingFrame.id);
              continue;
            }
            const patchContent = { ...(existingContent ?? {}), ...content };
            const updated = await ctx.runMutation(api.frames.update, {
              viewerSubject: viewer.subject,
              frameId: existingFrame.id as any,
              patch: {
                content: patchContent,
                style: { ...(existingFrame.style ?? {}), ...frameTextStyle(slot.role) },
                expectedVersion: existingFrame.version
              }
            });
            updatedNodeIds.push(String(updated.id));
            byStableKey.set(key, updated as FrameDto);
            continue;
          }

          const mappedImage = imageMapping.slotImages[slot.slotId];
          const placeholderContent = createImagePlaceholderContent(slot.slotId, slot.frameType, meta);

          if (!existingFrame) {
            let content = placeholderContent;
            let crop: Record<string, unknown> | null | undefined = null;
            if (mappedImage) {
              content = {
                ...buildFillSlotWithImagePatch({
                  frameType: slot.frameType,
                  currentContent: placeholderContent,
                  assetId: mappedImage.mediaAssetId,
                  sourceUrl: mappedImage.sourceUrl,
                  previewUrl: mappedImage.previewUrl,
                  caption: slot.captionSlotId ? (textMapping.slotText[slot.captionSlotId] ?? "") : "",
                  attribution: mappedImage.attribution as Record<string, unknown> | null
                }).content,
                populateMeta: meta
              } as Record<string, unknown>;
              crop = mappedImage.crop;
            }
            const created = await ctx.runMutation(api.frames.create, {
              viewerSubject: viewer.subject,
              pageId: pageId as any,
              type: slot.frameType,
              x: slot.x,
              y: slot.y,
              w: slot.w,
              h: slot.h,
              zIndex: slot.zIndex,
              locked: false,
              style: slot.frameType === "FRAME" ? { borderRadius: 16, overflow: "hidden" } : { borderRadius: 12 },
              content,
              crop: crop ?? undefined
            });
            createdNodeIds.push(String(created.id));
            continue;
          }

          if (!mappedImage) {
            skippedNodeIds.push(existingFrame.id);
            continue;
          }

          const existingContent = recordOrNull(existingFrame.content) ?? {};
          const currentSourceUrl =
            stringValue(existingContent.sourceUrl) ??
            stringValue(recordOrNull(existingContent.imageRef)?.sourceUrl) ??
            "";
          if (currentSourceUrl === mappedImage.sourceUrl) {
            skippedNodeIds.push(existingFrame.id);
            continue;
          }

          const imagePatch = buildFillSlotWithImagePatch({
            frameType: slot.frameType,
            currentContent: { ...existingContent, populateMeta: meta },
            assetId: mappedImage.mediaAssetId,
            sourceUrl: mappedImage.sourceUrl,
            previewUrl: mappedImage.previewUrl,
            caption: slot.captionSlotId ? (textMapping.slotText[slot.captionSlotId] ?? "") : "",
            attribution: mappedImage.attribution as Record<string, unknown> | null
          });
          const updated = await ctx.runMutation(api.frames.update, {
            viewerSubject: viewer.subject,
            frameId: existingFrame.id as any,
            patch: {
              content: { ...(imagePatch.content as Record<string, unknown>), populateMeta: meta },
              crop: mappedImage.crop,
              expectedVersion: existingFrame.version
            }
          });
          updatedNodeIds.push(String(updated.id));
          byStableKey.set(key, updated as FrameDto);
        }
      }

      const draftFp = fingerprintDraft(draft);
      const illFp = fingerprintIllustrations(illustrationState);
      const state = await ctx.runMutation(api.chapterStudioState.upsertPopulationState, {
        viewerSubject: viewer.subject,
        storybookId: args.storybookId,
        chapterInstanceId: args.chapterInstanceId,
        chapterKey: chapter.chapterKey,
        status: "populated",
        lastAppliedDraftVersion: draft.version,
        lastAppliedIllustrationVersion: illustrationState.version,
        pageIds
      });

      await ctx.runMutation(api.studioDocs.save, {
        viewerSubject: viewer.subject,
        storybookId: args.storybookId,
        note: `populate:${chapter.chapterKey}:${draft.version}:${illustrationState.version}`
      });

      return {
        ok: true as const,
        storybookId: String(args.storybookId),
        chapterInstanceId: String(args.chapterInstanceId),
        chapterKey: chapter.chapterKey,
        pageIds,
        firstPageId: pageIds[0] ?? null,
        createdNodeIds,
        updatedNodeIds,
        skippedNodeIds,
        reused: false as const,
        skippedBecauseEdited: false as const,
        versions: {
          draftVersion: draft.version,
          illustrationVersion: illustrationState.version
        },
        metadata: {
          chapterKey: chapter.chapterKey,
          chapterInstanceId: String(args.chapterInstanceId),
          lastAppliedDraftVersion: draft.version,
          lastAppliedIllustrationVersion: illustrationState.version,
          draftFingerprint: draftFp,
          illustrationFingerprint: illFp,
          pageIds,
          stableNodes: pageSpecs.flatMap((pageSpec) =>
            pageSpec.slots.map((slot) => ({
              pageTemplateId: pageSpec.pageTemplateId,
              slotId: slot.slotId,
              nodeId: stableNodeKey(chapter.chapterKey, pageSpec.pageTemplateId, slot.slotId),
              nodeType: slot.kind === "text" ? "TEXT" : slot.frameType
            }))
          ),
          warnings: [...textMapping.warnings],
          populatedAt: state.state.updatedAt
        }
      };
    } catch (error) {
      return {
        ok: false as const,
        errorCode: "POPULATE_FAILED",
        message: error instanceof Error ? error.message : "Studio population failed",
        retryable: true
      };
    }
  }
});
