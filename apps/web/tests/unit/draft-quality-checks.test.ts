import { describe, expect, it } from "vitest";
import { runDraftQualityChecks } from "../../../../lib/ai/qualityChecks";

describe("runDraftQualityChecks", () => {
  it("returns an error for empty output", () => {
    const result = runDraftQualityChecks({
      sections: [{ sectionId: "intro", title: "Opening", text: "", wordCount: 0, citations: [] }],
      summary: "",
      entities: { people: [], places: [], dates: [] },
      entitiesV2: null,
      answers: [{ questionId: "q1", answerText: "My father told me stories." }],
      targetLength: "medium"
    });

    expect(result.errors[0]?.code).toBe("EMPTY_OUTPUT");
  });

  it("flags entity sanity warning for names not in answers", () => {
    const result = runDraftQualityChecks({
      sections: [
        {
          sectionId: "intro",
          title: "Opening",
          text: "Alexander visited Delhi and met Priya for tea in the evening.",
          wordCount: 11,
          citations: ["q1"]
        }
      ],
      summary: "A memory.",
      entities: { people: ["Alexander"], places: ["Delhi"], dates: [] },
      entitiesV2: {
        people: [{ value: "Alexander", kind: "person", confidence: 0.92, citations: ["q1"], source: "llm" }],
        places: [{ value: "Delhi", confidence: 0.94, citations: ["q1"], source: "llm" }],
        dates: [],
        meta: { version: 2, generatedAt: Date.now(), generator: "llm_extractor_v2" }
      },
      answers: [{ questionId: "q1", answerText: "I met my cousin Ravi at home." }],
      targetLength: "short"
    });

    expect(result.warnings.some((warning) => warning.code === "ENTITY_SANITY")).toBe(true);
  });
});
