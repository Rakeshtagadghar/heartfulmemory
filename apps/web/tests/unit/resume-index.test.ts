import { describe, expect, it } from "vitest";
import { getResumeIndex } from "../../lib/wizard/resumeIndex";

describe("getResumeIndex", () => {
  it("returns first unanswered required question before optional gaps", () => {
    const questions = [
      { questionId: "q1", required: true },
      { questionId: "q2", required: false },
      { questionId: "q3", required: true }
    ];
    const answers = [
      { questionId: "q1", answerText: "Answered", skipped: false },
      { questionId: "q2", answerText: null, skipped: false }
    ];

    expect(getResumeIndex({ questions, answers })).toBe(2);
  });

  it("returns last step when all questions are answered or skipped", () => {
    const questions = [
      { questionId: "q1", required: true },
      { questionId: "q2", required: true }
    ];
    const answers = [
      { questionId: "q1", answerText: "A", skipped: false },
      { questionId: "q2", answerText: null, skipped: true }
    ];

    expect(getResumeIndex({ questions, answers })).toBe(1);
  });
});

