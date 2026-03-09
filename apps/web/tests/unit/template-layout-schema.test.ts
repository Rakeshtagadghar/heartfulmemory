import { describe, expect, it } from "vitest";
import {
  TEMPLATE_LAYOUT_SCHEMA_VERSION,
  coerceTemplateLayoutDefinition,
  validateTemplateLayoutDefinition,
  type TemplateLayoutDefinition,
} from "../../../../packages/shared/templates/layoutTypes";

function makeValidLayoutDefinition(): TemplateLayoutDefinition {
  return {
    layoutSchemaVersion: TEMPLATE_LAYOUT_SCHEMA_VERSION,
    pageLayouts: [
      {
        pageLayoutId: "chapter_main_v1",
        name: "Chapter Main",
        pageRole: "story_page",
        sizePreset: "BOOK_8_5X11",
        supportedOrientations: ["portrait"],
        slots: [
          {
            slotId: "title",
            kind: "text",
            role: "title",
            bindingKey: "chapterTitle",
            x: 60,
            y: 64,
            w: 696,
            h: 72,
            zIndex: 1,
            overflowBehavior: "shrink_to_fit",
            maxLines: 2,
            alignment: "center"
          },
          {
            slotId: "image1",
            kind: "image",
            role: "image",
            bindingKey: "primaryImage",
            x: 60,
            y: 156,
            w: 470,
            h: 320,
            zIndex: 2,
            imageFit: "cover",
            focalPoint: { x: 0.5, y: 0.3 }
          },
          {
            slotId: "caption1",
            kind: "text",
            role: "caption",
            bindingKey: "imageCaption1",
            x: 60,
            y: 484,
            w: 470,
            h: 20,
            zIndex: 3,
            overflowBehavior: "clip",
            maxLines: 2
          },
          {
            slotId: "body",
            kind: "text",
            role: "body",
            bindingKey: "chapterBody",
            x: 552,
            y: 156,
            w: 204,
            h: 320,
            zIndex: 4,
            minTextLength: 20,
            maxTextLength: 500
          }
        ]
      }
    ],
    chapterPagePlans: [
      {
        chapterKey: "ch_origins",
        pages: [{ pageLayoutId: "chapter_main_v1", pageRole: "story_page" }]
      }
    ],
    defaultPageLayoutIdsByRole: {
      story_page: "chapter_main_v1"
    }
  };
}

describe("template layout schema v1", () => {
  it("coerces canonical layout fields from template-shaped JSON", () => {
    const coerced = coerceTemplateLayoutDefinition({
      ...makeValidLayoutDefinition(),
      pageLayouts: [
        {
          ...makeValidLayoutDefinition().pageLayouts[0],
          previewThumbnailUrlIfAvailable: "https://example.com/preview.png",
          slots: [
            {
              ...makeValidLayoutDefinition().pageLayouts[0].slots[0],
              overflowBehaviorIfText: "continue_to_next_page"
            },
            {
              ...makeValidLayoutDefinition().pageLayouts[0].slots[1],
              imageFitIfImage: "contain",
              focalPointIfImage: { x: 0.25, y: 0.75 }
            },
            ...makeValidLayoutDefinition().pageLayouts[0].slots.slice(2)
          ]
        }
      ]
    });

    expect(coerced).not.toBeNull();
    expect(coerced?.layoutSchemaVersion).toBe(TEMPLATE_LAYOUT_SCHEMA_VERSION);
    expect(coerced?.pageLayouts[0]?.previewThumbnailUrl).toBe("https://example.com/preview.png");
    expect(coerced?.pageLayouts[0]?.slots[0]?.overflowBehavior).toBe("continue_to_next_page");
    expect(coerced?.pageLayouts[0]?.slots[1]?.imageFit).toBe("contain");
    expect(coerced?.pageLayouts[0]?.slots[1]?.focalPoint).toEqual({ x: 0.25, y: 0.75 });
  });

  it("accepts a valid canonical layout definition and slot bindings", () => {
    const validation = validateTemplateLayoutDefinition(makeValidLayoutDefinition(), {
      requireDefinition: true,
      slotBindings: [
        { bindingKey: "origins.body", pageLayoutId: "chapter_main_v1", slotId: "body" },
        { bindingKey: "origins.title", pageLayoutId: "chapter_main_v1", slotId: "title" }
      ]
    });

    expect(validation.ok).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("rejects duplicate slot ids and broken layout references", () => {
    const invalid = makeValidLayoutDefinition();
    invalid.pageLayouts[0] = {
      ...invalid.pageLayouts[0],
      slots: [
        ...invalid.pageLayouts[0].slots,
        { slotId: "body", kind: "text", role: "body", x: 0, y: 0, w: 100, h: 80, zIndex: 5 }
      ]
    };
    invalid.chapterPagePlans[0] = {
      chapterKey: "ch_origins",
      pages: [{ pageLayoutId: "missing_layout_v1", pageRole: "story_page" }]
    };
    invalid.defaultPageLayoutIdsByRole = {
      story_page: "missing_layout_v1"
    };

    const validation = validateTemplateLayoutDefinition(invalid, {
      requireDefinition: true,
      slotBindings: [{ bindingKey: "origins.body", pageLayoutId: "chapter_main_v1", slotId: "missing_slot" }]
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "SLOT_ID_DUPLICATE",
        "CHAPTER_PAGE_PLAN_INVALID",
        "DEFAULT_LAYOUT_REFERENCE_INVALID",
        "SLOT_BINDING_REFERENCE_INVALID"
      ])
    );
  });

  it("rejects text/image-only fields on incompatible slot kinds", () => {
    const invalid = makeValidLayoutDefinition();
    invalid.pageLayouts[0] = {
      ...invalid.pageLayouts[0],
      slots: [
        {
          ...invalid.pageLayouts[0].slots[0],
          imageFit: "cover"
        },
        {
          ...invalid.pageLayouts[0].slots[1],
          overflowBehavior: "clip"
        },
        ...invalid.pageLayouts[0].slots.slice(2)
      ]
    };

    const validation = validateTemplateLayoutDefinition(invalid, {
      requireDefinition: true,
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["SLOT_FIELD_KIND_INVALID"])
    );
  });
});
