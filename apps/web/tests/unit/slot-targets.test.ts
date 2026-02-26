import { describe, expect, it } from "vitest";
import { extractSlotTargetsForChapter } from "../../../../packages/shared/templates/slotTargets";

describe("Sprint 20 slot target extraction", () => {
  it("returns deterministic fallback slots when studioPages metadata is absent", () => {
    const template = {
      templateId: "t1",
      version: 2,
      title: "Template",
      subtitle: "x",
      isActive: true,
      chapters: []
    };

    const first = extractSlotTargetsForChapter(template as never, "ch_origins");
    const second = extractSlotTargetsForChapter(template as never, "ch_origins");

    expect(first).toEqual(second);
    expect(first.map((s) => s.slotId)).toEqual(["image1", "image2", "image3"]);
  });

  it("extracts image slots from chapter studioPages metadata with aspect/orientation", () => {
    const template = {
      templateId: "t1",
      version: 2,
      title: "Template",
      subtitle: "x",
      isActive: true,
      chapters: [],
      studioPages: [
        {
          chapterKey: "ch_family",
          slots: [
            { id: "title1", kind: "text" },
            { slotId: "imageHero", kind: "image", aspectRatio: "16:9", sizeClass: "cover" },
            { slotId: "imageSquare", type: "image", aspectRatio: 1, sizeClass: "small" }
          ]
        }
      ]
    };

    const slots = extractSlotTargetsForChapter(template as never, "ch_family");

    expect(slots.map((s) => s.slotId)).toEqual(["imageHero", "imageSquare"]);
    expect(slots[0]?.orientation).toBe("landscape");
    expect(slots[0]?.minShortSidePx).toBe(2600);
    expect(slots[1]?.orientation).toBe("square");
    expect(slots[1]?.minShortSidePx).toBe(1000);
  });
});
