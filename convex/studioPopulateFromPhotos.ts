"use node";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { mapPhotosToImageSlots } from "../packages/shared/populate/photoSlotMapper";
import { buildFillSlotWithImagePatch } from "../packages/editor/commands/fillSlotWithImage";
import { getTemplateQuestionsForChapter } from "./templates";
import { captureConvexError, withConvexSpan } from "./observability/sentry";

// Reuse types from studioPopulate
type PageDto = { id: string; order_index: number; width_px: number; height_px: number };
type FrameDto = {
  id: string;
  page_id: string;
  type: "TEXT" | "IMAGE" | "SHAPE" | "LINE" | "FRAME" | "GROUP";
  x: number; y: number; w: number; h: number;
  z_index: number;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
  crop: Record<string, unknown> | null;
  version: number;
};
type ChapterAnswerDto = {
  questionId: string;
  answerText: string | null;
  answerJson?: unknown;
  skipped?: boolean;
  updatedAt?: number;
};
type TextSlotSpec = { slotId: string; kind: "text"; role: "title" | "subtitle" | "body" | "quote" | "caption"; x: number; y: number; w: number; h: number; zIndex: number };
type ImageSlotSpec = { slotId: string; kind: "image"; frameType: "IMAGE" | "FRAME"; captionSlotId?: string; x: number; y: number; w: number; h: number; zIndex: number };
type SlotSpec = TextSlotSpec | ImageSlotSpec;
type ChapterPageSpec = { pageTemplateId: string; slots: SlotSpec[] };

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
    .map((v) => (typeof v === "string" ? v.toLowerCase() : "")).filter(Boolean);
  if (candidates.some((v) => v.includes("image"))) return "image";
  if (candidates.some((v) => v.includes("text") || v.includes("title") || v.includes("caption") || v.includes("quote"))) return "text";
  return null;
}

function sanitizeKeyPart(value: string) {
  return value.trim().replaceAll(/[^a-zA-Z0-9_-]+/g, "_").replaceAll(/^_+/g, "").replaceAll(/_+$/g, "") || "item";
}

function readAnswerText(row: ChapterAnswerDto) {
  if (typeof row.answerText === "string" && row.answerText.trim().length > 0) return row.answerText.trim();
  if (typeof row.answerJson === "string" && row.answerJson.trim().length > 0) return row.answerJson.trim();
  if (row.answerJson && typeof row.answerJson === "object" && !Array.isArray(row.answerJson)) {
    const rec = row.answerJson as Record<string, unknown>;
    for (const k of [rec.answerText, rec.text, rec.answer, rec.value]) {
      if (typeof k === "string" && k.trim().length > 0) return k.trim();
    }
  }
  return "";
}

function buildAnswerPerPageSpecs(answerEntries: Array<{ questionId: string }>): ChapterPageSpec[] {
  return answerEntries.map((entry, index) => {
    const suffix = `${index + 1}_${sanitizeKeyPart(entry.questionId)}`;
    const includeHeader = index === 0;
    const slots: SlotSpec[] = [];
    if (includeHeader) {
      slots.push({ slotId: `title_${suffix}`, kind: "text", role: "title", x: 108, y: 72, w: 600, h: 56, zIndex: 1 });
    }
    slots.push(
      { slotId: `body_${suffix}`, kind: "text", role: "body", x: 96, y: includeHeader ? 144 : 92, w: 624, h: 260, zIndex: 2 },
      { slotId: `image_${suffix}`, kind: "image", frameType: "FRAME", x: 76, y: includeHeader ? 420 : 372, w: 664, h: 528, zIndex: 3 }
    );
    return { pageTemplateId: `answer_page_${suffix}`, slots };
  });
}

function stableNodeKey(chapterKey: string, pageTemplateId: string, slotId: string) {
  return `s28:${chapterKey}:${pageTemplateId}:${slotId}`;
}

function populateMetaPatch(chapterKey: string, pageTemplateId: string, slotId: string, kind: "text" | "image") {
  return { stableNodeKey: stableNodeKey(chapterKey, pageTemplateId, slotId), source: "studio_populate_v2", sourceKind: kind, chapterKey, pageTemplateId, slotId };
}

function frameTextStyle(role: TextSlotSpec["role"]) {
  if (role === "title") return { fontFamily: "serif", fontSize: 34, lineHeight: 1.12, fontWeight: 700, color: "#1e2430", align: "center" };
  if (role === "subtitle") return { fontFamily: "sans", fontSize: 16, lineHeight: 1.3, fontWeight: 500, color: "#3b465a", align: "left" };
  if (role === "quote") return { fontFamily: "serif", fontSize: 20, lineHeight: 1.25, fontWeight: 500, color: "#2a3141", italic: true, align: "left" };
  if (role === "caption") return { fontFamily: "sans", fontSize: 12, lineHeight: 1.2, fontWeight: 500, color: "#5a6375", align: "left" };
  return { fontFamily: "sans", fontSize: 15, lineHeight: 1.45, fontWeight: 400, color: "#293040", align: "left" };
}

async function requireActionUser(ctx: ActionCtx, explicitSubject?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject || identity?.tokenIdentifier || explicitSubject || null;
  if (!subject) throw new Error("Unauthorized");
  return { subject };
}

export const populateFromPhotos = action({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args): Promise<any> => { // NOSONAR
    try {
      const viewer = await requireActionUser(ctx, args.viewerSubject);

      const [storybook, chapters, photos] = await withConvexSpan(
        "populate_from_photos_fetch",
        { flow: "studio_populate_v2", storybookId: String(args.storybookId) },
        (): Promise<any> => Promise.all([
          ctx.runQuery(api.storybooks.getGuidedById, { viewerSubject: viewer.subject, storybookId: args.storybookId }),
          ctx.runQuery(api.storybookChapters.listByStorybook, { viewerSubject: viewer.subject, storybookId: args.storybookId }),
          ctx.runQuery(api.storybookPhotos.listPhotos, { viewerSubject: viewer.subject, storybookId: args.storybookId })
        ])
      );

      const template: any = storybook.templateId
        ? await ctx.runQuery(api.templates.getById, { templateId: storybook.templateId })
        : null;

      const sortedChapters = (Array.isArray(chapters) ? chapters : [])
        .toSorted((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

      const sortedPhotos = (Array.isArray(photos) ? photos : [])
        .filter((p: any) => p.sourceUrl)
        .toSorted((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

      // Extra answer: append to last chapter's answers
      const extraAnswerText: string | null =
        storybook.extraAnswer?.skipped === false && typeof storybook.extraAnswer?.text === "string" && storybook.extraAnswer.text.trim()
          ? storybook.extraAnswer.text.trim()
          : null;

      let globalPhotoIndex = 0;
      const allPageIds: string[] = [];
      let totalCreated = 0;
      let totalUpdated = 0;

      for (const chapter of sortedChapters) {
        const chapterAnswersRaw = await ctx.runQuery(api.chapterAnswers.getByChapter, {
          viewerSubject: viewer.subject,
          chapterInstanceId: chapter.id
        });
        const answersRaw = Array.isArray(chapterAnswersRaw) ? (chapterAnswersRaw as ChapterAnswerDto[]) : [];

        const questionOrder: string[] =
          template && typeof template === "object" && "questionFlow" in template
            ? getTemplateQuestionsForChapter(template as any, chapter.chapterKey).map((q: any) => q.questionId)
            : [];

        const answersByQuestionId = new Map(answersRaw.map((r) => [r.questionId, r] as const));
        const orderedAnswers: ChapterAnswerDto[] = [
          ...questionOrder.map((qId: string) => answersByQuestionId.get(qId)).filter(
            (r): r is ChapterAnswerDto => Boolean(r && !r.skipped && readAnswerText(r as ChapterAnswerDto).length > 0)
          ),
          ...answersRaw.filter(
            (r) => !questionOrder.includes(r.questionId) && !r.skipped && readAnswerText(r).length > 0
          ).toSorted((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0))
        ];

        // Append extra answer to last chapter
        const isLastChapter = sortedChapters[sortedChapters.length - 1]?.id === chapter.id;
        if (isLastChapter && extraAnswerText) {
          orderedAnswers.push({
            questionId: "q_anything_else",
            answerText: extraAnswerText,
            skipped: false
          });
        }

        if (orderedAnswers.length === 0) continue;

        const pageSpecs = buildAnswerPerPageSpecs(orderedAnswers);

        // Build photo slice for this chapter
        const chapterImageSlots = pageSpecs.flatMap((ps) => ps.slots.filter((s): s is ImageSlotSpec => s.kind === "image"));
        const chapterPhotos = sortedPhotos.slice(globalPhotoIndex, globalPhotoIndex + chapterImageSlots.length);
        globalPhotoIndex += chapterPhotos.length;

        const studioState = await ctx.runQuery(api.chapterStudioState.getByChapterInstance, {
          viewerSubject: viewer.subject,
          chapterInstanceId: chapter.id
        });

        let pages = await ctx.runQuery(api.pages.listByStorybook, { viewerSubject: viewer.subject, storybookId: args.storybookId });
        const existingPageIds = studioState?.pageIds ?? [];
        const pageIds: string[] = [];

        for (let i = 0; i < pageSpecs.length; i++) {
          const existingPageId = existingPageIds[i];
          if (existingPageId && (pages as PageDto[]).some((p) => p.id === existingPageId)) {
            pageIds.push(existingPageId);
            continue;
          }
          const createdPage = await ctx.runMutation(api.pages.create, { viewerSubject: viewer.subject, storybookId: args.storybookId });
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

        // Photo slot mapping for this chapter's image slots
        const photoMapping = mapPhotosToImageSlots({
          slotIds: chapterImageSlots.map((s) => s.slotId),
          photos: chapterPhotos.map((p: any) => ({
            mediaAssetId: p.assetId,
            sourceUrl: p.sourceUrl,
            width: p.width,
            height: p.height
          }))
        });

        // Build text mapping (answer per page)
        const textSlotMap: Record<string, string> = {};
        for (const [pageIndex, pageSpec] of pageSpecs.entries()) {
          const answer = orderedAnswers[pageIndex];
          if (!answer) continue;
          const titleSlot = pageSpec.slots.find((s): s is TextSlotSpec => s.kind === "text" && s.role === "title");
          const bodySlot = pageSpec.slots.find((s): s is TextSlotSpec => s.kind === "text" && s.role === "body");
          if (titleSlot?.slotId) textSlotMap[titleSlot.slotId] = chapter.title;
          if (bodySlot?.slotId) textSlotMap[bodySlot.slotId] = readAnswerText(answer);
        }

        for (const [pageIndex, pageSpec] of pageSpecs.entries()) {
          const pageId = pageIds[pageIndex];
          const page = (pages as PageDto[]).find((p) => p.id === pageId);
          if (!page) continue;

          const initialPageFrames = [...(framesByPageId.get(pageId) ?? [])].toSorted((a, b) => a.z_index - b.z_index);
          const expectedStableKeys = new Set(pageSpec.slots.map((slot) => stableNodeKey(chapter.chapterKey, pageSpec.pageTemplateId, slot.slotId)));

          // Remove stale populate frames
          const stalePopulateFrames = initialPageFrames.filter((frame) => {
            const content = recordOrNull(frame.content);
            const meta = recordOrNull(content?.populateMeta);
            if (!meta) return false;
            if (stringValue(meta.source) !== "studio_populate_v2") return false;
            if (stringValue(meta.chapterKey) !== chapter.chapterKey) return false;
            const key = stringValue(meta.stableNodeKey);
            return !key || !expectedStableKeys.has(key);
          });
          for (const stale of stalePopulateFrames) {
            await ctx.runMutation(api.frames.remove, { viewerSubject: viewer.subject, frameId: stale.id as any });
          }
          const staleFrameIds = new Set(stalePopulateFrames.map((f) => f.id));
          const pageFrames = initialPageFrames.filter((f) => !staleFrameIds.has(f.id));

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
              const text = textSlotMap[slot.slotId] ?? "";
              const content = { kind: "text_frame_v1", text, populateMeta: meta };
              if (existingFrame) {
                const existingContent = recordOrNull(existingFrame.content);
                const existingText = stringValue(existingContent?.text) ?? "";
                if (existingText !== text) {
                  await ctx.runMutation(api.frames.update, {
                    viewerSubject: viewer.subject, frameId: existingFrame.id as any,
                    patch: { content: { ...existingContent, ...content }, style: { ...existingFrame.style, ...frameTextStyle(slot.role) }, expectedVersion: existingFrame.version }
                  });
                  totalUpdated++;
                }
              } else {
                const created = await ctx.runMutation(api.frames.create, {
                  viewerSubject: viewer.subject, pageId: pageId as any,
                  type: "TEXT", x: slot.x, y: slot.y, w: slot.w, h: slot.h, zIndex: slot.zIndex,
                  locked: false, style: frameTextStyle(slot.role), content
                });
                totalCreated++;
                byStableKey.set(key, created as FrameDto);
              }
              continue;
            }

            // Image slot
            const mappedImage = photoMapping.slotImages[slot.slotId];
            const placeholderContent = {
              kind: slot.frameType === "FRAME" ? "frame_node_v1" : "image_frame_v1",
              placeholderLabel: `Image placeholder (${slot.slotId})`,
              imageRef: null,
              attribution: null,
              populateMeta: meta
            };

            if (!existingFrame) {
              let content: Record<string, unknown> = placeholderContent;
              let crop: Record<string, unknown> | null | undefined = null;
              if (mappedImage) {
                content = {
                  ...buildFillSlotWithImagePatch({
                    frameType: slot.frameType,
                    currentContent: placeholderContent,
                    assetId: mappedImage.mediaAssetId,
                    sourceUrl: mappedImage.sourceUrl,
                    previewUrl: mappedImage.previewUrl,
                    caption: "",
                    attribution: null
                  }).content,
                  populateMeta: meta
                } as Record<string, unknown>;
                crop = mappedImage.crop;
              }
              await ctx.runMutation(api.frames.create, {
                viewerSubject: viewer.subject, pageId: pageId as any,
                type: slot.frameType, x: slot.x, y: slot.y, w: slot.w, h: slot.h, zIndex: slot.zIndex,
                locked: false, style: slot.frameType === "FRAME" ? { borderRadius: 16, overflow: "hidden" } : { borderRadius: 12 },
                content, crop: crop ?? undefined
              });
              totalCreated++;
            } else if (mappedImage) {
              // Frame exists but may be a placeholder — apply the photo if not already set
              const existingContent = recordOrNull(existingFrame.content);
              const existingImageUrl =
                slot.frameType === "FRAME"
                  ? stringValue(recordOrNull(existingContent?.imageRef)?.sourceUrl)
                  : stringValue(existingContent?.sourceUrl);
              if (existingImageUrl !== mappedImage.sourceUrl) {
                const patch = buildFillSlotWithImagePatch({
                  frameType: slot.frameType,
                  currentContent: existingContent,
                  assetId: mappedImage.mediaAssetId,
                  sourceUrl: mappedImage.sourceUrl,
                  previewUrl: mappedImage.previewUrl,
                  caption: "",
                  attribution: null
                });
                await ctx.runMutation(api.frames.update, {
                  viewerSubject: viewer.subject, frameId: existingFrame.id as any,
                  patch: {
                    content: { ...patch.content, populateMeta: meta },
                    crop: mappedImage.crop ?? undefined,
                    expectedVersion: existingFrame.version
                  }
                });
                totalUpdated++;
              }
            }
          }
        }

        // Update chapter studio state
        await ctx.runMutation(api.chapterStudioState.upsertPopulationState, {
          viewerSubject: viewer.subject,
          storybookId: args.storybookId,
          chapterInstanceId: chapter.id,
          chapterKey: chapter.chapterKey,
          status: "populated",
          lastAppliedDraftVersion: null,
          lastAppliedIllustrationVersion: null,
          pageIds
        });

        allPageIds.push(...pageIds);
      }

      // Mark storybook as ready
      await ctx.runMutation(api.storybooks.setFlowStatus, {
        viewerSubject: viewer.subject,
        storybookId: args.storybookId,
        flowStatus: "ready_in_studio"
      });

      await ctx.runMutation(api.studioDocs.save, {
        viewerSubject: viewer.subject,
        storybookId: args.storybookId,
        note: `populate_from_photos:${Date.now()}`
      });

      return {
        ok: true as const,
        storybookId: String(args.storybookId),
        pageIds: allPageIds,
        firstPageId: allPageIds[0] ?? null,
        chaptersPopulated: sortedChapters.length,
        photosPlaced: Math.min(globalPhotoIndex, sortedPhotos.length),
        totalCreated,
        totalUpdated
      };
    } catch (error) {
      captureConvexError(error, {
        flow: "studio_populate_v2",
        code: "POPULATE_FROM_PHOTOS_FAILED",
        storybookId: String(args.storybookId)
      });
      await ctx.runMutation(api.storybooks.setFlowStatus, {
        viewerSubject: args.viewerSubject,
        storybookId: args.storybookId,
        flowStatus: "error"
      }).catch(() => undefined);
      return {
        ok: false as const,
        errorCode: "POPULATE_FROM_PHOTOS_FAILED",
        message: error instanceof Error ? error.message : "Studio population failed",
        retryable: true
      };
    }
  }
});
