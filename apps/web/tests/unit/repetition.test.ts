import { describe, expect, it } from "vitest";
import { findRepeatedSentencesAcrossSections } from "../../../../lib/ai/validators/repetition";

describe("repetition detector", () => {
  it("detects repeated sentences across sections", () => {
    const hits = findRepeatedSentencesAcrossSections([
      {
        sectionId: "intro",
        text: "We always gathered in the courtyard at sunset to listen to stories. The air smelled of tea."
      },
      {
        sectionId: "main",
        text: "We always gathered in the courtyard at sunset to listen to stories. My uncle would begin softly."
      },
      {
        sectionId: "reflection",
        text: "Those evenings taught us patience and belonging."
      }
    ]);

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.sectionIds.sort()).toEqual(["intro", "main"]);
  });
});

