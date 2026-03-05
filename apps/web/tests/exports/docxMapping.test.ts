import { describe, expect, it } from "vitest";
import {
  orderChaptersForDocx,
  type DocxChapter,
} from "../../lib/export/docx/generateDocx";

describe("DOCX mapping", () => {
  describe("orderChaptersForDocx", () => {
    it("sorts chapters by orderIndex ascending", () => {
      const chapters = [
        { title: "Chapter 3", orderIndex: 2 },
        { title: "Chapter 1", orderIndex: 0 },
        { title: "Chapter 2", orderIndex: 1 },
      ];
      const result = orderChaptersForDocx(chapters);
      expect(result.map((c) => c.title)).toEqual([
        "Chapter 1",
        "Chapter 2",
        "Chapter 3",
      ]);
    });

    it("returns empty array for no chapters", () => {
      const result = orderChaptersForDocx([]);
      expect(result).toEqual([]);
    });

    it("is deterministic with same orderIndex values", () => {
      const chapters = [
        { title: "A", orderIndex: 0 },
        { title: "B", orderIndex: 0 },
      ];
      const r1 = orderChaptersForDocx(chapters);
      const r2 = orderChaptersForDocx(chapters);
      expect(r1.map((c) => c.title)).toEqual(r2.map((c) => c.title));
    });

    it("does not mutate the original array", () => {
      const chapters = [
        { title: "B", orderIndex: 1 },
        { title: "A", orderIndex: 0 },
      ];
      const original = [...chapters];
      orderChaptersForDocx(chapters);
      expect(chapters).toEqual(original);
    });
  });

  describe("DocxChapter structure", () => {
    it("maps answers to paragraphs correctly", () => {
      const answers = [
        { chapterInstanceId: "ch1", questionId: "q2", answerPlain: "Second answer" },
        { chapterInstanceId: "ch1", questionId: "q1", answerPlain: "First answer" },
        { chapterInstanceId: "ch2", questionId: "q1", answerPlain: "Other chapter" },
      ];

      // Simulate the mapping logic from the API route
      const ch1Answers = answers
        .filter((a) => a.chapterInstanceId === "ch1")
        .sort((a, b) => a.questionId.localeCompare(b.questionId));

      const chapter: DocxChapter = {
        title: "Test Chapter",
        orderIndex: 0,
        paragraphs: ch1Answers
          .map((a) => a.answerPlain)
          .filter((t): t is string => Boolean(t)),
      };

      expect(chapter.paragraphs).toEqual(["First answer", "Second answer"]);
    });

    it("filters out null/empty answers", () => {
      const answers = [
        { answerPlain: "Valid" },
        { answerPlain: null },
        { answerPlain: "" },
        { answerPlain: "Also valid" },
      ];

      const paragraphs = answers
        .map((a) => a.answerPlain)
        .filter((t): t is string => Boolean(t));

      expect(paragraphs).toEqual(["Valid", "Also valid"]);
    });
  });
});
