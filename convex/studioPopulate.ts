"use node";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { mapDraftToTextSlots, mapNarrativeToTextSlots, type TextSlotMapResult } from "../packages/shared/populate/textSlotMapper";
import { mapIllustrationsToImageSlots } from "../packages/shared/populate/imageSlotMapper";
import { buildFillSlotWithImagePatch } from "../packages/editor/commands/fillSlotWithImage";
import { getTemplateQuestionsForChapter } from "./templates";
import {
  buildResolvedLayoutFingerprint,
  resolveTemplateChapterPageLayouts,
  type ResolvedChapterPageLayout,
  type ResolvedFrameLayoutSlot,
  type ResolvedImageLayoutSlot,
  type ResolvedLayoutSlot,
  type ResolvedLineLayoutSlot,
  type ResolvedShapeLayoutSlot,
  type ResolvedTextLayoutSlot,
} from "../packages/shared/templates/layoutResolver";
import { captureConvexError, withConvexSpan } from "./observability/sentry";

type PageDto = {
  id: string;
  title?: string;
  page_layout_id?: string | null;
  layout_source_template_id?: string | null;
  layout_source_template_version?: number | null;
  layout_fingerprint?: string | null;
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

type ChapterAnswerDto = {
  questionId: string;
  answerText: string | null;
  answerJson?: unknown;
  skipped?: boolean;
  updatedAt?: number;
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

function sanitizeKeyPart(value: string) {
  const sanitized = value.trim().replaceAll(/[^a-zA-Z0-9_-]+/g, "_").replaceAll(/^_+/g, "").replaceAll(/_+$/g, "");
  return sanitized || "item";
}

function slotLookupKey(slot: { slotId: string; bindingKey?: string }) {
  const bindingKey = typeof slot.bindingKey === "string" ? slot.bindingKey.trim() : "";
  return bindingKey.length > 0 ? bindingKey : slot.slotId;
}

function remapTextBySlotId(slotText: Record<string, string>, slots: ResolvedTextLayoutSlot[]) {
  const remapped: Record<string, string> = {};
  for (const slot of slots) {
    const lookupKey = slotLookupKey(slot);
    const value = slotText[slot.slotId] ?? slotText[lookupKey];
    if (typeof value === "string") remapped[slot.slotId] = value;
  }
  return remapped;
}

function remapImagesBySlotId(
  slotImages: Record<
    string,
    {
      mediaAssetId: string;
      sourceUrl: string;
      previewUrl: string;
      attribution: unknown;
      crop: Record<string, unknown>;
    }
  >,
  slots: ResolvedImageLayoutSlot[]
) {
  const remapped: typeof slotImages = {};
  for (const slot of slots) {
    const lookupKey = slotLookupKey(slot);
    const value = slotImages[slot.slotId] ?? slotImages[lookupKey];
    if (value) remapped[slot.slotId] = value;
  }
  return remapped;
}

function readSlotText(
  slotText: Record<string, string | undefined>,
  slot: { slotId: string; bindingKey?: string }
) {
  return slotText[slot.slotId] ?? slotText[slotLookupKey(slot)] ?? "";
}

function buildAnswerPerPageSpecs(answerEntries: Array<{ questionId: string }>): ResolvedChapterPageLayout[] {
  return answerEntries.map((entry, index) => {
    const suffix = `${index + 1}_${sanitizeKeyPart(entry.questionId)}`;
    const includeChapterHeader = index === 0;
    const slots: ResolvedLayoutSlot[] = [];
    if (includeChapterHeader) {
      // Keep chapter header centered and fully inside default safe area (44px margins on 816px page width).
      slots.push({
        slotId: `title_${suffix}`,
        kind: "text",
        role: "title",
        bindingKey: "chapterTitle",
        x: 108,
        y: 72,
        w: 600,
        h: 56,
        zIndex: 1,
        overflowBehavior: "shrink_to_fit",
        maxLines: 2,
        alignment: "center"
      });
    }
    slots.push(
      {
        slotId: `body_${suffix}`,
        kind: "text",
        role: "body",
        bindingKey: "answerBody",
        x: 96,
        y: includeChapterHeader ? 144 : 92,
        w: 624,
        h: 260,
        zIndex: 2,
        overflowBehavior: "shrink_to_fit"
      },
      {
        slotId: `image_${suffix}`,
        kind: "image",
        frameType: "FRAME",
        bindingKey: "answerImage",
        x: 76,
        y: includeChapterHeader ? 420 : 372,
        w: 664,
        h: 528,
        zIndex: 3,
        imageFit: "cover"
      }
    );
    return {
      pageLayoutId: `answer_page_${suffix}`,
      source: "fallback",
      layoutVersion: null,
      layoutFingerprint: buildResolvedLayoutFingerprint(`answer_page_${suffix}`, slots, null),
      slots
    } satisfies ResolvedChapterPageLayout;
  });
}

function stableNodeKey(chapterKey: string, pageLayoutId: string, slotId: string) {
  return `s21:${chapterKey}:${pageLayoutId}:${slotId}`;
}

function populateMetaPatch(
  chapterKey: string,
  pageLayoutId: string,
  slotId: string,
  bindingKey: string | undefined,
  kind: ResolvedLayoutSlot["kind"],
  layoutVersion: number | null,
  layoutFingerprint: string
) {
  return {
    stableNodeKey: stableNodeKey(chapterKey, pageLayoutId, slotId),
    source: "studio_populate_v1",
    sourceKind: kind,
    chapterKey,
    pageTemplateId: pageLayoutId,
    pageLayoutId,
    slotId,
    bindingKey: bindingKey ?? null,
    layoutVersion,
    layoutFingerprint
  };
}

function frameTextStyle(slot: ResolvedTextLayoutSlot) {
  const align = slot.alignment ?? slot.style?.align;
  if (slot.role === "title") {
    return { fontFamily: "serif", fontSize: 34, lineHeight: 1.12, fontWeight: 700, color: "#1e2430", align: align ?? "center" };
  }
  if (slot.role === "subtitle") {
    return { fontFamily: "sans", fontSize: 16, lineHeight: 1.3, fontWeight: 500, color: "#3b465a", align: align ?? "left" };
  }
  if (slot.role === "quote") {
    return { fontFamily: "serif", fontSize: 20, lineHeight: 1.25, fontWeight: 500, color: "#2a3141", italic: true, align: align ?? "left" };
  }
  if (slot.role === "caption") {
    return { fontFamily: "sans", fontSize: 12, lineHeight: 1.2, fontWeight: 500, color: "#5a6375", align: align ?? "left" };
  }
  return { fontFamily: "sans", fontSize: 15, lineHeight: 1.45, fontWeight: 400, color: "#293040", align: align ?? "left" };
}

function decorativeShapeStyle(slot: ResolvedShapeLayoutSlot) {
  return {
    fill: "#e9dcc7",
    borderColor: "#d6c090",
    borderWidth: 0,
    borderRadius: 12,
    ...(slot.style ?? {})
  };
}

function decorativeLineStyle(slot: ResolvedLineLayoutSlot) {
  return {
    stroke: "#d6c090",
    strokeWidth: Math.max(1, Math.min(slot.h, 4)),
    ...(slot.style ?? {})
  };
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

function createFrameSlotPlaceholderContent(slotId: string, meta: Record<string, unknown>) {
  return {
    kind: "frame_node_v1",
    placeholderLabel: `Frame slot (${slotId})`,
    imageRef: null,
    attribution: null,
    populateMeta: meta
  };
}

function createShapeSlotContent(slotId: string, meta: Record<string, unknown>) {
  return {
    kind: "shape_node_v1",
    shapeType: "rect",
    label: slotId,
    populateMeta: meta
  };
}

function createLineSlotContent(meta: Record<string, unknown>) {
  return {
    kind: "line_node_v1",
    populateMeta: meta
  };
}

function fingerprintDraft(narrative: any) {
  return `n:${narrative.version}:${narrative.paragraphs?.opening?.length}:${narrative.paragraphs?.story?.length}:${narrative.paragraphs?.closing?.length}`;
}

function fingerprintIllustrations(
  illustration: { version: number; slotAssignments: Array<{ slotId: string; mediaAssetId: string }> }
) {
  const assignments = illustration.slotAssignments.map((slot) => `${slot.slotId}:${slot.mediaAssetId}`).sort().join("|");
  return `i:${illustration.version}:${assignments}`;
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

function readAnswerText(row: ChapterAnswerDto) {
  if (typeof row.answerText === "string" && row.answerText.trim().length > 0) {
    return row.answerText.trim();
  }
  if (typeof row.answerJson === "string" && row.answerJson.trim().length > 0) {
    return row.answerJson.trim();
  }
  if (row.answerJson && typeof row.answerJson === "object" && !Array.isArray(row.answerJson)) {
    const record = row.answerJson as Record<string, unknown>;
    const candidates = [record.answerText, record.text, record.answer, record.value];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  }
  return "";
}

function resolveChapterHeaderPageTitle(
  pageSpec: ResolvedChapterPageLayout,
  slotText: Record<string, string | undefined>
) {
  const titleSlot = pageSpec.slots.find(
    (slot): slot is ResolvedTextLayoutSlot => slot.kind === "text" && slot.role === "title"
  );
  if (!titleSlot?.slotId) return null;
  const text = readSlotText(slotText, titleSlot);
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const populateChapter = action({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args): Promise<any> => { // NOSONAR
    try {
      const viewer = await requireActionUser(ctx, args.viewerSubject);
      const [storybook, chapter, draft, illustrationState, studioState, chapterAnswers] = await withConvexSpan<any>(
        "studio_populate_fetch_inputs",
        {
          flow: "studio_populate",
          storybookId: String(args.storybookId),
          chapterInstanceId: String(args.chapterInstanceId)
        },
        (): Promise<any> =>
          Promise.all([
            ctx.runQuery(api.storybooks.getGuidedById, { viewerSubject: viewer.subject, storybookId: args.storybookId }),
            ctx.runQuery(api.storybookChapters.get, { viewerSubject: viewer.subject, chapterInstanceId: args.chapterInstanceId }),
            ctx.runQuery(api.chapterNarratives.getByChapterInstanceId, { chapterInstanceId: args.chapterInstanceId }),
            ctx.runQuery(api.chapterIllustrations.getLatestByChapterInstance, {
              viewerSubject: viewer.subject,
              chapterInstanceId: args.chapterInstanceId
            }),
            ctx.runQuery(api.chapterStudioState.getByChapterInstance, {
              viewerSubject: viewer.subject,
              chapterInstanceId: args.chapterInstanceId
            }),
            ctx.runQuery(api.chapterAnswers.getByChapter, {
              viewerSubject: viewer.subject,
              chapterInstanceId: args.chapterInstanceId
            })
          ])
      );

      const template: any = storybook.templateId
        ? await ctx.runQuery(api.templates.getById, { templateId: storybook.templateId })
        : null;

      if (!draft || draft.status !== "ready") {
        return { ok: false as const, errorCode: "NARRATIVE_NOT_READY", message: "Chapter narrative is not ready.", retryable: false };
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
        studioState.status === "finalized" &&
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

      const answersRaw = Array.isArray(chapterAnswers) ? (chapterAnswers as ChapterAnswerDto[]) : [];
      const answersByQuestionId = new Map(
        answersRaw.map((row) => [row.questionId, row] as const)
      );
      const questionOrder: any[] =
        template && typeof template === "object" && "questionFlow" in template
          ? getTemplateQuestionsForChapter(template as any, chapter.chapterKey).map((question) => question.questionId)
          : [];
      const orderedAnswers: any[] = [
        ...questionOrder
          .map((questionId: any) => answersByQuestionId.get(questionId))
          .filter(
            (row): row is ChapterAnswerDto =>
              Boolean(row && !row.skipped && readAnswerText(row as ChapterAnswerDto).length > 0)
          ),
        ...answersRaw
          .filter(
            (row) =>
              !questionOrder.includes(row.questionId) &&
              !row.skipped &&
              readAnswerText(row).length > 0
          )
          .sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0))
      ];

      const answerPageSpecs: ResolvedChapterPageLayout[] = orderedAnswers.length > 0 ? buildAnswerPerPageSpecs(orderedAnswers) : [];
      const pageSpecs: ResolvedChapterPageLayout[] =
        answerPageSpecs.length > 0
          ? answerPageSpecs
          : resolveTemplateChapterPageLayouts(template?.templateJson ?? template, chapter.chapterKey);
      let pages = await ctx.runQuery(api.pages.listByStorybook, { viewerSubject: viewer.subject, storybookId: args.storybookId });
      const existingPageIds = studioState?.pageIds ?? [];
      const pageIds: string[] = [];
      const templateVersion = typeof template?.version === "number" ? template.version : null;

      for (let i = 0; i < pageSpecs.length; i += 1) {
        const existingPageId = existingPageIds[i];
        if (existingPageId && pages.some((page: any) => String(page.id) === existingPageId)) {
          pageIds.push(existingPageId);
          continue;
        }
        const createdPage = await ctx.runMutation(api.pages.create, {
          viewerSubject: viewer.subject,
          storybookId: args.storybookId,
          pageLayoutId: pageSpecs[i]?.pageLayoutId ?? null,
          layoutSourceTemplateId: storybook.templateId ?? null,
          layoutSourceTemplateVersion: templateVersion,
          layoutFingerprint: pageSpecs[i]?.layoutFingerprint ?? null
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
      const imageSlots = pageSpecs.flatMap((page) => page.slots.filter((slot): slot is ResolvedImageLayoutSlot => slot.kind === "image"));
      const textSlots = pageSpecs.flatMap((page) => page.slots.filter((slot): slot is ResolvedTextLayoutSlot => slot.kind === "text"));
      const useAnswerPages = answerPageSpecs.length > 0;

      const textMapping: TextSlotMapResult = useAnswerPages
        ? {
          slotText: Object.fromEntries(
            answerPageSpecs.flatMap((pageSpec, index) => {
              const answer = orderedAnswers[index];
              if (!answer) return [];
              const titleSlot = pageSpec?.slots.find((slot): slot is ResolvedTextLayoutSlot => slot.kind === "text" && slot.role === "title");
              const bodySlot = pageSpec?.slots.find((slot): slot is ResolvedTextLayoutSlot => slot.kind === "text" && slot.role === "body");
              const text = readAnswerText(answer);
              const pairs: Array<readonly [string, string]> = [];
              if (titleSlot?.slotId) pairs.push([titleSlot.slotId, chapter.title]);
              if (bodySlot?.slotId) pairs.push([bodySlot.slotId, text]);
              return pairs;
            })
          ),
          warnings: []
        }
          : (() => {
            const rawMapping = mapNarrativeToTextSlots({
              chapterTitle: chapter.title,
              chapterSubtitle: null,
              narrative: draft as any,
              slotIds: textSlots.map((slot) => slotLookupKey(slot))
            });
            return {
              ...rawMapping,
              slotText: remapTextBySlotId(rawMapping.slotText, textSlots)
            };
          })();

      let imageMapping;
      if (useAnswerPages) {
        const slotAssetsRecord = (illustrationSlotMap?.slots ?? {}) as Record<string, any>;
        const orderedIllustrationAssets: any[] = [];
        for (const assignment of illustrationState.slotAssignments ?? []) {
          const asset = slotAssetsRecord[assignment.slotId];
          if (asset && typeof asset === "object") orderedIllustrationAssets.push(asset);
        }
        if (orderedIllustrationAssets.length === 0) {
          for (const key of Object.keys(slotAssetsRecord).sort()) {
            const asset = slotAssetsRecord[key];
            if (asset && typeof asset === "object") orderedIllustrationAssets.push(asset);
          }
        }
        const sequentialSlotAssets: Record<string, any> = {};
        imageSlots.forEach((slot, index) => {
          const asset = orderedIllustrationAssets[index];
          if (asset) sequentialSlotAssets[slot.slotId] = asset;
        });
        const rawImageMapping = mapIllustrationsToImageSlots({
          slotIds: imageSlots.map((slot) => slotLookupKey(slot)),
          slotAssets: Object.fromEntries(
            imageSlots.flatMap((slot) => {
              const asset = sequentialSlotAssets[slot.slotId];
              if (!asset) return [];
              return [[slotLookupKey(slot), asset] as const];
            })
          )
        });
        imageMapping = {
          slotImages: remapImagesBySlotId(rawImageMapping.slotImages, imageSlots)
        };
      } else {
        const rawSlotAssets = (illustrationSlotMap?.slots ?? {}) as Record<string, any>;
        const rawImageMapping = mapIllustrationsToImageSlots({
          slotIds: imageSlots.map((slot) => slotLookupKey(slot)),
          slotAssets: Object.fromEntries(
            imageSlots.flatMap((slot) => {
              const asset = rawSlotAssets[slotLookupKey(slot)] ?? rawSlotAssets[slot.slotId];
              if (!asset) return [];
              return [[slotLookupKey(slot), asset] as const];
            })
          )
        });
        imageMapping = {
          slotImages: remapImagesBySlotId(rawImageMapping.slotImages, imageSlots)
        };
      }

      const createdNodeIds: string[] = [];
      const updatedNodeIds: string[] = [];
      const skippedNodeIds: string[] = [];

      for (const [pageIndex, pageSpec] of pageSpecs.entries()) {
        const pageId = pageIds[pageIndex];
        const page = (pages as PageDto[]).find((row) => row.id === pageId);
        if (!page) continue;

        if (
          page.page_layout_id !== pageSpec.pageLayoutId ||
          page.layout_source_template_id !== (storybook.templateId ?? null) ||
          page.layout_source_template_version !== templateVersion ||
          page.layout_fingerprint !== pageSpec.layoutFingerprint
        ) {
          await ctx.runMutation(api.pages.update, {
            viewerSubject: viewer.subject,
            pageId: pageId as any,
            patch: {
              pageLayoutId: pageSpec.pageLayoutId,
              layoutSourceTemplateId: storybook.templateId ?? null,
              layoutSourceTemplateVersion: templateVersion,
              layoutFingerprint: pageSpec.layoutFingerprint
            }
          });
          page.page_layout_id = pageSpec.pageLayoutId;
          page.layout_source_template_id = storybook.templateId ?? null;
          page.layout_source_template_version = templateVersion;
          page.layout_fingerprint = pageSpec.layoutFingerprint;
        }

        const chapterHeaderTitle = resolveChapterHeaderPageTitle(
          pageSpec,
          textMapping.slotText as Record<string, string | undefined>
        );
        if (chapterHeaderTitle && page.title !== chapterHeaderTitle) {
          await ctx.runMutation(api.pages.update, {
            viewerSubject: viewer.subject,
            pageId: pageId as any,
            patch: { title: chapterHeaderTitle }
          });
          page.title = chapterHeaderTitle;
        }

        const initialPageFrames = [...(framesByPageId.get(pageId) ?? [])].sort((a, b) => a.z_index - b.z_index);
        const expectedStableKeys = new Set(
          pageSpec.slots.map((slot) => stableNodeKey((chapter as any).chapterKey, pageSpec.pageLayoutId, slot.slotId))
        );
        const stalePopulateFrames = initialPageFrames.filter((frame) => {
          const content = recordOrNull(frame.content);
          const meta = recordOrNull(content?.populateMeta);
          if (!meta) return false;
          if (stringValue(meta.source) !== "studio_populate_v1") return false;
          if (stringValue(meta.chapterKey) !== chapter.chapterKey) return false;
          const key = stringValue(meta.stableNodeKey);
          return !key || !expectedStableKeys.has(key);
        });

        for (const stale of stalePopulateFrames) {
          await ctx.runMutation(api.frames.remove, {
            viewerSubject: viewer.subject,
            frameId: stale.id as any
          });
        }

        const staleFrameIds = new Set(stalePopulateFrames.map((frame) => frame.id));
        const pageFrames = initialPageFrames.filter((frame) => !staleFrameIds.has(frame.id));

        const byStableKey = new Map<string, FrameDto>();
        for (const frame of pageFrames) {
          const content = recordOrNull(frame.content);
          const meta = recordOrNull(content?.populateMeta);
          const key = stringValue(meta?.stableNodeKey);
          if (key) byStableKey.set(key, frame);
        }

        for (const slot of pageSpec.slots) {
          const meta = populateMetaPatch(
            chapter.chapterKey,
            pageSpec.pageLayoutId,
            slot.slotId,
            slot.bindingKey,
            slot.kind,
            pageSpec.layoutVersion,
            pageSpec.layoutFingerprint
          );
          const key = String(meta.stableNodeKey);
          const existingFrame = byStableKey.get(key);

          if (slot.kind === "text") {
            const text = readSlotText(textMapping.slotText, slot);
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
                style: { ...frameTextStyle(slot), ...(slot.style ?? {}) },
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
            const patchContent = existingContent ? { ...existingContent, ...content } : { ...content };
            const updated = await ctx.runMutation(api.frames.update, {
              viewerSubject: viewer.subject,
              frameId: existingFrame.id as any,
              patch: {
                content: patchContent,
                style: { ...existingFrame.style, ...frameTextStyle(slot), ...(slot.style ?? {}) },
                expectedVersion: existingFrame.version
              }
            });
            updatedNodeIds.push(String(updated.id));
            byStableKey.set(key, updated as FrameDto);
            continue;
          }

          if (slot.kind === "image") {
            const mappedImage = imageMapping.slotImages[slot.slotId];
            const placeholderContent = createImagePlaceholderContent(slot.slotId, slot.frameType, meta);

            if (!existingFrame) {
              let content: Record<string, unknown> = placeholderContent as Record<string, unknown>;
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
                locked: slot.locked ?? false,
                style: slot.frameType === "FRAME" ? { borderRadius: 16, overflow: "hidden", ...(slot.style ?? {}) } : { borderRadius: 12, ...(slot.style ?? {}) },
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
            continue;
          }

          const commonPatch = {
            x: slot.x,
            y: slot.y,
            w: slot.w,
            h: slot.h,
            z_index: slot.zIndex,
            locked: slot.locked ?? false,
            expectedVersion: existingFrame?.version
          };

          if (slot.kind === "frame") {
            const content = createFrameSlotPlaceholderContent(slot.slotId, meta);
            if (!existingFrame) {
              const created = await ctx.runMutation(api.frames.create, {
                viewerSubject: viewer.subject,
                pageId: pageId as any,
                type: "FRAME",
                x: slot.x,
                y: slot.y,
                w: slot.w,
                h: slot.h,
                zIndex: slot.zIndex,
                locked: slot.locked ?? false,
                style: { borderRadius: 16, overflow: "hidden", ...(slot.style ?? {}) },
                content
              });
              createdNodeIds.push(String(created.id));
            } else {
              const updated = await ctx.runMutation(api.frames.update, {
                viewerSubject: viewer.subject,
                frameId: existingFrame.id as any,
                patch: {
                  ...commonPatch,
                  style: { ...(existingFrame.style ?? {}), borderRadius: 16, overflow: "hidden", ...(slot.style ?? {}) },
                  content
                }
              });
              updatedNodeIds.push(String(updated.id));
            }
            continue;
          }

          if (slot.kind === "shape" || slot.kind === "decorative") {
            const content = createShapeSlotContent(slot.slotId, meta);
            if (!existingFrame) {
              const created = await ctx.runMutation(api.frames.create, {
                viewerSubject: viewer.subject,
                pageId: pageId as any,
                type: "SHAPE",
                x: slot.x,
                y: slot.y,
                w: slot.w,
                h: slot.h,
                zIndex: slot.zIndex,
                locked: slot.locked ?? false,
                style: decorativeShapeStyle(slot),
                content
              });
              createdNodeIds.push(String(created.id));
            } else {
              const updated = await ctx.runMutation(api.frames.update, {
                viewerSubject: viewer.subject,
                frameId: existingFrame.id as any,
                patch: {
                  ...commonPatch,
                  style: decorativeShapeStyle(slot),
                  content
                }
              });
              updatedNodeIds.push(String(updated.id));
            }
            continue;
          }

          if (slot.kind === "line") {
            const content = createLineSlotContent(meta);
            if (!existingFrame) {
              const created = await ctx.runMutation(api.frames.create, {
                viewerSubject: viewer.subject,
                pageId: pageId as any,
                type: "LINE",
                x: slot.x,
                y: slot.y,
                w: slot.w,
                h: slot.h,
                zIndex: slot.zIndex,
                locked: slot.locked ?? false,
                style: decorativeLineStyle(slot),
                content
              });
              createdNodeIds.push(String(created.id));
            } else {
              const updated = await ctx.runMutation(api.frames.update, {
                viewerSubject: viewer.subject,
                frameId: existingFrame.id as any,
                patch: {
                  ...commonPatch,
                  style: decorativeLineStyle(slot),
                  content
                }
              });
              updatedNodeIds.push(String(updated.id));
            }
          }
        }
      }

      const draftFp = fingerprintDraft(draft);
      const illFp = fingerprintIllustrations(illustrationState);
      const state: any = await ctx.runMutation(api.chapterStudioState.upsertPopulationState, {
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
              pageTemplateId: pageSpec.pageLayoutId,
              slotId: slot.slotId,
              nodeId: stableNodeKey(chapter.chapterKey, pageSpec.pageLayoutId, slot.slotId),
              nodeType:
                slot.kind === "text"
                  ? "TEXT"
                  : slot.kind === "image"
                    ? slot.frameType
                    : slot.kind === "frame"
                      ? "FRAME"
                      : slot.kind === "line"
                        ? "LINE"
                        : "SHAPE"
            }))
          ),
          warnings: [...textMapping.warnings],
          populatedAt: state.state.updatedAt
        }
      };
    } catch (error) {
      captureConvexError(error, {
        flow: "studio_populate",
        code: "POPULATE_FAILED",
        storybookId: String(args.storybookId),
        chapterInstanceId: String(args.chapterInstanceId)
      });
      return {
        ok: false as const,
        errorCode: "POPULATE_FAILED",
        message: error instanceof Error ? error.message : "Studio population failed",
        retryable: true
      };
    }
  }
});
