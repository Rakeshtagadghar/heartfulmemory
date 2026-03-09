import {
  buildAdminTemplateLayoutBuilderLoadResponse,
  buildAdminTemplateLayoutBuilderValidation,
  buildAdminTemplateLayoutPreview,
} from "../../../../packages/shared/admin/templateLayoutBuilder";
import {
  coerceTemplateLayoutDefinition,
  type TemplateLayoutDefinition,
} from "../../../../packages/shared/templates/layoutTypes";

function buildLayoutDefinition(): TemplateLayoutDefinition {
  return {
    layoutSchemaVersion: 1 as const,
    pageLayouts: [
      {
        pageLayoutId: "story_primary",
        name: "Story Primary",
        description: "Primary editorial page",
        pageRole: "story_page" as const,
        pageType: "editorial",
        sizePreset: "BOOK_8_5X11" as const,
        supportedOrientations: ["portrait", "landscape"],
        supportsReflowMode: true,
        previewThumbnailUrl: "https://example.com/preview.png",
        defaultStyles: {
          backgroundColor: "#fef3c7",
          fill: "#fef3c7",
        },
        slots: [
          {
            slotId: "title",
            kind: "text" as const,
            role: "title",
            bindingKey: "chapterTitle",
            x: 48,
            y: 64,
            w: 520,
            h: 96,
            zIndex: 1,
            locked: true,
            required: true,
            styleTokenRef: "headline.serif",
            style: {
              color: "#111827",
              fontFamily: "Fraunces",
              fontSize: 26,
              lineHeight: 1.2,
              fontWeight: 700,
              align: "center" as const,
            },
            overflowBehavior: "clip" as const,
            maxLines: 2,
            alignment: "center" as const,
            editMode: "editable" as const,
            minTextLength: 10,
            maxTextLength: 160,
          },
          {
            slotId: "hero_image",
            kind: "image" as const,
            role: "image",
            bindingKey: "primaryImage",
            x: 48,
            y: 188,
            w: 420,
            h: 300,
            zIndex: 2,
            required: true,
            styleTokenRef: "photo.hero",
            imageFit: "contain" as const,
            focalPoint: { x: 0.25, y: 0.75 },
            captionSlotId: "caption",
            frameType: "FRAME" as const,
            editMode: "populate_only" as const,
          },
          {
            slotId: "caption",
            kind: "text" as const,
            role: "caption",
            bindingKey: "primaryCaption",
            x: 488,
            y: 500,
            w: 220,
            h: 60,
            zIndex: 3,
            overflowBehavior: "shrink_to_fit" as const,
            alignment: "left" as const,
          },
        ],
      },
    ],
    chapterPagePlans: [
      {
        chapterKey: "chapter_1",
        pages: [{ pageLayoutId: "story_primary", pageRole: "story_page" as const }],
      },
    ],
    defaultPageLayoutIdsByRole: {
      story_page: "story_primary",
    },
  };
}

describe("template layout builder shared contracts", () => {
  it("round-trips builder-editable fields through canonical layout coercion", () => {
    const definition = buildLayoutDefinition();

    const coerced = coerceTemplateLayoutDefinition(JSON.parse(JSON.stringify(definition)));

    expect(coerced).toEqual(definition);
  });

  it("builds load responses with enriched layout metadata", () => {
    const definition = buildLayoutDefinition();

    const response = buildAdminTemplateLayoutBuilderLoadResponse({
      templateId: "tpl_1",
      templateName: "Template One",
      templateStatus: "published",
      canManage: true,
      lastSavedAt: Date.UTC(2026, 2, 9, 12, 30, 0),
      publishedVersionRef: "template:tpl_1:v12",
      layoutDefinition: definition,
      selectedLayoutId: "story_primary",
    });

    expect(response.layouts).toEqual([
      expect.objectContaining({
        pageLayoutId: "story_primary",
        description: "Primary editorial page",
        sizePreset: "BOOK_8_5X11",
        supportsReflowMode: true,
      }),
    ]);
    expect(response.selectedLayoutId).toBe("story_primary");
    expect(response.draftState.publishedVersionRef).toBe("template:tpl_1:v12");
    expect(response.validation.isValid).toBe(true);
  });

  it("emits preview warnings and background fill from canonical layout data", () => {
    const definition = buildLayoutDefinition();
    definition.pageLayouts[0].slots[0] = {
      ...definition.pageLayouts[0].slots[0],
      w: 120,
      h: 40,
    };

    const preview = buildAdminTemplateLayoutPreview(definition, "story_primary", "text_stress_test");

    expect(preview.renderedPreviewRefOrData?.backgroundFill).toBe("#fef3c7");
    expect(preview.renderedPreviewRefOrData?.items[0]).toEqual(
      expect.objectContaining({
        slotId: "title",
        alignment: "center",
        maxLines: 2,
      })
    );
    expect(preview.warnings).toContain('Text slot "title" may clip in stress preview mode.');
  });

  it("flags caption links that are not attached to image slots", () => {
    const definition = buildLayoutDefinition();
    definition.pageLayouts[0].slots[0] = {
      ...definition.pageLayouts[0].slots[0],
      captionSlotId: "caption",
    };

    const validation = buildAdminTemplateLayoutBuilderValidation(definition);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SLOT_CAPTION_REFERENCE_INVALID",
          path: "pageLayouts[0].slots[0].captionSlotId",
        }),
      ])
    );
  });
});
