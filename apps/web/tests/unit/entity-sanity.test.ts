import { describe, expect, it } from "vitest";
import { runEntitySanityChecks } from "../../../../lib/ai/qualityChecks/entitySanity";
import { runDraftQualityChecks } from "../../../../lib/ai/qualityChecks";

describe("entity sanity checks", () => {
  it("filters stopword-like entity values and keeps answer-grounded places", () => {
    const result = runEntitySanityChecks({
      entities: {
        people: ["The", "My", "Ravi"],
        places: ["India", "Maharashtra"],
        dates: []
      },
      answers: [
        {
          questionId: "q1",
          answerText: "We moved from Maharashtra in India when I was young, and my cousin Ravi visited often."
        }
      ]
    });

    expect(result.invalidStopwords).toEqual(expect.arrayContaining(["The", "My"]));
    expect(result.unexpected).not.toContain("India");
    expect(result.unexpected).not.toContain("Maharashtra");
    expect(result.unexpected).not.toContain("Ravi");
  });

  it("quality checks no longer scan section text for random capitalized tokens", () => {
    const result = runDraftQualityChecks({
      sections: [
        {
          sectionId: "intro",
          title: "Opening",
          text: "Write as the storyteller. Keep the tone warm. Narration voice: first person.",
          wordCount: 13,
          citations: ["q1"]
        }
      ],
      summary: "A memory.",
      entities: { people: [], places: [], dates: [] },
      answers: [{ questionId: "q1", answerText: "I met my cousin Ravi at home in Pune." }],
      targetLength: "short"
    });

    expect(result.warnings.some((warning) => warning.code === "ENTITY_SANITY")).toBe(false);
  });
});

