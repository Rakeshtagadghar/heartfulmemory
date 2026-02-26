import { describe, expect, it } from "vitest";
import { validateChapterCompletion } from "../../lib/chapters/validateChapterCompletion";

describe("validateChapterCompletion", () => {
  it("returns missing required question ids", () => {
    const result = validateChapterCompletion({
      requiredQuestionIds: ["q1", "q2", "q3"],
      answeredQuestionIds: ["q1", "q3"]
    });

    expect(result.ok).toBe(false);
    expect(result.missingQuestionIds).toEqual(["q2"]);
  });

  it("passes when all required questions are answered", () => {
    const result = validateChapterCompletion({
      requiredQuestionIds: ["q1", "q2"],
      answeredQuestionIds: ["q1", "q2", "q_optional"]
    });

    expect(result.ok).toBe(true);
    expect(result.missingQuestionIds).toEqual([]);
  });
});

