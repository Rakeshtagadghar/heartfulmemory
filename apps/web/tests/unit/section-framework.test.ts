import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHAPTER_SECTION_FRAMEWORK,
  getSectionFrameworkForChapterKey
} from "../../../../packages/shared/templates/sectionFramework";

describe("section framework", () => {
  it("returns deterministic base sections for generic chapter keys", () => {
    const first = getSectionFrameworkForChapterKey("ch_memories");
    const second = getSectionFrameworkForChapterKey("ch_memories");

    expect(first).toEqual(second);
    expect(first.map((section) => section.sectionId)).toEqual(
      DEFAULT_CHAPTER_SECTION_FRAMEWORK.map((section) => section.sectionId)
    );
  });

  it("adds school override sections for school-like chapter keys", () => {
    const sections = getSectionFrameworkForChapterKey("ch_school_days");
    expect(sections.map((section) => section.sectionId)).toContain("teachers_friends");
  });
});

