import { describe, expect, it } from "vitest";
import { buildThemeFromEntities } from "../../../../lib/illustrate/themeFromEntities";

describe("buildThemeFromEntities", () => {
  it("uses places and avoids personal names by default", () => {
    const theme = buildThemeFromEntities({
      chapterKey: "ch_origins",
      entitiesV2: {
        people: [{ value: "Rakesh", kind: "person", confidence: 0.9, citations: ["q1"], source: "llm" }],
        places: [
          { value: "Maharashtra", confidence: 0.9, citations: ["q2"], source: "llm" },
          { value: "India", confidence: 0.9, citations: ["q2"], source: "llm" }
        ],
        dates: [],
        meta: { version: 2, generatedAt: Date.now(), generator: "llm_extractor_v2" }
      }
    });

    expect(theme.placeKeywords).toContain("maharashtra");
    expect(theme.placeKeywords).toContain("india");
    expect(theme.keywords).not.toContain("rakesh");
    expect(theme.negativeKeywords).toContain("portrait");
  });

  it("varies chapter style by chapter key", () => {
    const origins = buildThemeFromEntities({ chapterKey: "ch_origins", entities: { places: ["India"] } });
    const school = buildThemeFromEntities({ chapterKey: "ch_school_days", entities: { places: ["India"] } });
    expect(origins.keywords.join(" ")).not.toBe(school.keywords.join(" "));
  });
});
