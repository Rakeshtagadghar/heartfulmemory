import { describe, expect, it } from "vitest";
import { mapDraftToTextSlots } from "../../../../packages/shared/populate/textSlotMapper";

describe("textSlotMapper", () => {
  const draft: Parameters<typeof mapDraftToTextSlots>[0]["draft"] = {
    summary: "We built a home full of music and patience. Every room held a story.",
    sections: [
      {
        sectionId: "opening",
        title: "Opening",
        text: "We met in a crowded station and learned each other's rhythms slowly.",
        wordCount: 14,
        citations: []
      },
      {
        sectionId: "middle",
        title: "Middle",
        text: "Years later, we built a home where Sunday meals and songs became our tradition.",
        wordCount: 16,
        citations: []
      }
    ],
    quotes: [],
    imageIdeas: [
      { query: "family dinner table", reason: "Sunday meals became the center of family life.", slotHint: "image1" }
    ],
    entities: { people: ["Mom"], places: ["Hyderabad"], dates: ["1989"] }
  };

  it("maps deterministically and uses quote fallback when quotes are missing", () => {
    const slotIds = ["title", "body", "quote", "caption1", "caption2", "subtitle"];
    const first = mapDraftToTextSlots({
      chapterTitle: "Chapter 1: Home",
      chapterSubtitle: null,
      draft,
      slotIds,
      maxBodyChars: 10_000
    });
    const second = mapDraftToTextSlots({
      chapterTitle: "Chapter 1: Home",
      chapterSubtitle: null,
      draft,
      slotIds,
      maxBodyChars: 10_000
    });

    expect(first).toEqual(second);
    expect(first.slotText.title).toBe("Chapter 1: Home");
    expect(first.slotText.quote.length).toBeGreaterThan(0);
    expect(first.warnings.some((warning) => warning.code === "QUOTE_FALLBACK")).toBe(true);
    expect(first.slotText.caption1).toContain("Sunday meals");
    expect(first.slotText.caption2.length).toBeGreaterThan(0);
  });

  it("truncates long body text and emits a warning", () => {
    const result = mapDraftToTextSlots({
      chapterTitle: "Chapter 2",
      draft: {
        ...draft,
        sections: [
          {
            sectionId: "long",
            title: "Long",
            text: "A".repeat(120),
            wordCount: 1,
            citations: []
          }
        ]
      },
      slotIds: ["body"],
      maxBodyChars: 30
    });

    expect(result.slotText.body.endsWith("...")).toBe(true);
    expect(result.warnings.some((warning) => warning.code === "BODY_TRUNCATED")).toBe(true);
  });
});
