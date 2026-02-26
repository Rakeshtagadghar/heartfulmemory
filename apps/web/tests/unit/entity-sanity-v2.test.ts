import { describe, expect, it } from "vitest";
import { runEntitySanityChecksV2 } from "../../../../lib/ai/qualityChecks/entitySanity_v2";

describe("runEntitySanityChecksV2", () => {
  it("warns only for genuinely inconsistent entities", () => {
    const result = runEntitySanityChecksV2({
      entitiesV2: {
        people: [{ value: "Mother", kind: "role", confidence: 0.92, citations: ["q1"], source: "llm" }],
        places: [{ value: "Maharashtra", confidence: 0.93, citations: ["q2"], source: "llm" }],
        dates: [{ value: "2008", normalized: "2008", confidence: 0.5, citations: ["q3"], source: "llm" }],
        meta: { version: 2, generatedAt: Date.now(), generator: "llm_extractor_v2" }
      },
      answers: [
        { questionId: "q1", answerText: "My mother told us stories at night." },
        { questionId: "q2", answerText: "We lived in Maharashtra, India." },
        { questionId: "q3", answerText: "It happened around 2008." }
      ]
    });

    expect(result.missingCitations).toEqual([]);
    expect(result.notInCitedAnswers).toEqual([]);
    expect(result.lowConfidence).toContain("dates:2008");
  });

  it("flags missing citations instead of tokenized stopword noise", () => {
    const result = runEntitySanityChecksV2({
      entitiesV2: {
        people: [{ value: "Our", kind: "person", confidence: 0.9, citations: [], source: "llm" }],
        places: [],
        dates: [],
        meta: { version: 2, generatedAt: Date.now(), generator: "llm_extractor_v2" }
      },
      answers: [{ questionId: "q1", answerText: "Our family home was small." }]
    });

    expect(result.missingCitations).toContain("people:Our");
  });
});
