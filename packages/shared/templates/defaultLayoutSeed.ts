import {
  TEMPLATE_LAYOUT_SCHEMA_VERSION,
  type TemplateLayoutDefinition,
  type TemplatePageLayoutDefinition,
} from "./layoutTypes";
import type { GuidedTemplateV2 } from "./templateTypes";

const DEFAULT_CHAPTER_LAYOUT_ID = "chapter_main_v1";
const DEFAULT_ANSWER_LAYOUT_ID = "answer_page_v1";

const DEFAULT_CHAPTER_LAYOUT: TemplatePageLayoutDefinition = {
  pageLayoutId: DEFAULT_CHAPTER_LAYOUT_ID,
  name: "Chapter Main",
  description: "Default chapter story layout migrated from the original hardcoded Studio populate geometry.",
  pageRole: "story_page",
  sizePreset: "BOOK_8_5X11",
  supportedOrientations: ["portrait"],
  slots: [
    { slotId: "title", kind: "text", role: "title", bindingKey: "chapterTitle", x: 60, y: 64, w: 696, h: 72, zIndex: 1, overflowBehavior: "shrink_to_fit", maxLines: 2, alignment: "center" },
    { slotId: "image1", kind: "image", role: "image", bindingKey: "primaryImage", frameType: "FRAME", captionSlotId: "caption1", x: 60, y: 156, w: 470, h: 320, zIndex: 2, imageFit: "cover" },
    { slotId: "body", kind: "text", role: "body", bindingKey: "chapterBody", x: 552, y: 156, w: 204, h: 320, zIndex: 3, overflowBehavior: "shrink_to_fit" },
    { slotId: "quote", kind: "text", role: "quote", bindingKey: "chapterQuote", x: 60, y: 498, w: 696, h: 86, zIndex: 4, overflowBehavior: "clip", maxLines: 4 },
    { slotId: "caption1", kind: "text", role: "caption", bindingKey: "imageCaption1", x: 60, y: 484, w: 470, h: 20, zIndex: 5, overflowBehavior: "clip", maxLines: 2 },
    { slotId: "image2", kind: "image", role: "image", bindingKey: "galleryImage1", frameType: "IMAGE", captionSlotId: "caption2", x: 60, y: 624, w: 332, h: 240, zIndex: 6, imageFit: "cover" },
    { slotId: "image3", kind: "image", role: "image", bindingKey: "galleryImage2", frameType: "IMAGE", captionSlotId: "caption3", x: 424, y: 624, w: 332, h: 240, zIndex: 7, imageFit: "cover" },
    { slotId: "caption2", kind: "text", role: "caption", bindingKey: "imageCaption2", x: 60, y: 872, w: 332, h: 26, zIndex: 8, overflowBehavior: "clip", maxLines: 2 },
    { slotId: "caption3", kind: "text", role: "caption", bindingKey: "imageCaption3", x: 424, y: 872, w: 332, h: 26, zIndex: 9, overflowBehavior: "clip", maxLines: 2 }
  ]
};

const DEFAULT_ANSWER_LAYOUT: TemplatePageLayoutDefinition = {
  pageLayoutId: DEFAULT_ANSWER_LAYOUT_ID,
  name: "Answer Page",
  description: "Default answer-driven page layout migrated from the original per-answer Studio populate geometry.",
  pageRole: "answer_page",
  sizePreset: "BOOK_8_5X11",
  supportedOrientations: ["portrait"],
  slots: [
    { slotId: "title", kind: "text", role: "title", bindingKey: "chapterTitle", x: 108, y: 72, w: 600, h: 56, zIndex: 1, overflowBehavior: "shrink_to_fit", maxLines: 2, alignment: "center" },
    { slotId: "body", kind: "text", role: "body", bindingKey: "answerBody", x: 96, y: 144, w: 624, h: 260, zIndex: 2, overflowBehavior: "shrink_to_fit" },
    { slotId: "image", kind: "image", role: "image", bindingKey: "answerImage", frameType: "FRAME", x: 76, y: 420, w: 664, h: 528, zIndex: 3, imageFit: "cover" }
  ]
};

export function buildDefaultTemplateLayoutDefinition(template: Pick<GuidedTemplateV2, "chapters">): TemplateLayoutDefinition {
  return {
    layoutSchemaVersion: TEMPLATE_LAYOUT_SCHEMA_VERSION,
    pageLayouts: [DEFAULT_CHAPTER_LAYOUT, DEFAULT_ANSWER_LAYOUT],
    chapterPagePlans: template.chapters.map((chapter) => ({
      chapterKey: chapter.chapterKey,
      pages: [{ pageLayoutId: DEFAULT_CHAPTER_LAYOUT_ID, pageRole: "story_page" }]
    })),
    defaultPageLayoutIdsByRole: {
      story_page: DEFAULT_CHAPTER_LAYOUT_ID,
      answer_page: DEFAULT_ANSWER_LAYOUT_ID
    }
  };
}

export function withDefaultTemplateLayouts<T extends GuidedTemplateV2>(template: T): T {
  if (
    typeof (template as Partial<TemplateLayoutDefinition>).layoutSchemaVersion === "number" &&
    Array.isArray((template as Partial<TemplateLayoutDefinition>).pageLayouts) &&
    Array.isArray((template as Partial<TemplateLayoutDefinition>).chapterPagePlans)
  ) {
    return template;
  }

  return {
    ...template,
    ...buildDefaultTemplateLayoutDefinition(template)
  };
}
