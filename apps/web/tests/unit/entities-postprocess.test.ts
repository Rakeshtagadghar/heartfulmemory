import { describe, expect, it } from "vitest";
import { postprocessEntitiesV2 } from "../../../../lib/entities/postprocess";

describe("postprocessEntitiesV2", () => {
  it("removes stopwords from people and keeps Maharashtra/India places", () => {
    const result = postprocessEntitiesV2({
      people: [
        { value: "The", kind: "person", confidence: 0.9, citations: ["q1"], source: "llm" },
        { value: "Mother", kind: "role", confidence: 0.9, citations: ["q1"], source: "llm" }
      ],
      places: [
        { value: "Maharashtra", confidence: 0.8, citations: ["q2"], source: "llm" },
        { value: "India", confidence: 0.9, citations: ["q2"], source: "llm" }
      ],
      dates: [],
      meta: { version: 2, generatedAt: Date.now(), generator: "llm_extractor_v2" }
    });

    expect(result.entities.people.map((p) => p.value)).toEqual(["Mother"]);
    expect(result.entities.places.map((p) => p.value)).toEqual(["Maharashtra", "India"]);
    expect(result.warnings.some((warning) => warning.code === "PERSON_STOPWORD_REMOVED")).toBe(true);
  });

  it("dedupes and normalizes dates", () => {
    const result = postprocessEntitiesV2({
      people: [],
      places: [],
      dates: [
        { value: "June 2008", normalized: "June 2008", confidence: 0.9, citations: ["q1"], source: "llm" },
        { value: "2008-06", normalized: "2008-06", confidence: 0.9, citations: ["q1"], source: "llm" }
      ],
      meta: { version: 2, generatedAt: Date.now(), generator: "llm_extractor_v2" }
    });

    expect(result.entities.dates).toHaveLength(1);
    expect(result.entities.dates[0]?.normalized).toBe("2008-06");
  });
});
