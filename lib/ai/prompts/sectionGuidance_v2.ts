import type { ChapterDraftSectionDefinition } from "../../../packages/shared/drafts/draftTypes";
import { getSectionFrameworkForChapterKey } from "../../../packages/shared/templates/sectionFramework";

function guidanceOverrideForSection(section: ChapterDraftSectionDefinition): string | null {
  const id = section.sectionId.toLowerCase();
  const title = section.title.toLowerCase();

  if (id.includes("intro") || title.includes("opening")) {
    return "Opening: set context with sensory detail and emotional tone. Write prose, not a list. Avoid repeating later section openings.";
  }
  if (id.includes("timeline") || title.includes("timeline")) {
    return "Timeline: give a chronological sequence using only facts from answers. If no dates are present, use sequence words like First, Then, After that. Do not invent dates.";
  }
  if (id.includes("reflection") || title.includes("reflection")) {
    return "Reflection: focus on meaning, values, and lessons. Avoid repeating factual details already covered in the story section.";
  }
  if (id.includes("main") || title.includes("story")) {
    return "Story: narrate the events and people with specificity. Avoid repeating the opening lines or summary wording.";
  }
  return `${section.guidance} Keep this section distinct from other sections and avoid repeated first sentences.`;
}

export function getSectionFrameworkForChapterKeyV2(chapterKey: string): ChapterDraftSectionDefinition[] {
  return getSectionFrameworkForChapterKey(chapterKey).map((section) => ({
    ...section,
    guidance: guidanceOverrideForSection(section) ?? section.guidance
  }));
}

