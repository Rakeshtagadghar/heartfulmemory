import type { ChapterDraftSectionDefinition } from "../drafts/draftTypes";

const BASE_SECTION_FRAMEWORK: ChapterDraftSectionDefinition[] = [
  {
    sectionId: "intro",
    title: "Opening",
    guidance: "Set scene and context based on answers."
  },
  {
    sectionId: "main",
    title: "The Story",
    guidance: "Narrate key events and emotions with specificity."
  },
  {
    sectionId: "reflection",
    title: "Reflection",
    guidance: "Lessons, values, and meaning grounded in answers."
  },
  {
    sectionId: "closing",
    title: "Closing",
    guidance: "Warm closing paragraph; connect to the next chapter if possible."
  }
];

const SCHOOL_SECTION_OVERRIDE: ChapterDraftSectionDefinition = {
  sectionId: "teachers_friends",
  title: "Teachers & Friends",
  guidance: "Highlight memorable teachers, classmates, and relationships from the answers."
};

const WEDDING_SECTION_OVERRIDE: ChapterDraftSectionDefinition = {
  sectionId: "ceremony_highlights",
  title: "Ceremony Highlights",
  guidance: "Capture the ceremony moments, guests, and emotional highlights from the answers."
};

const TIMELINE_SECTION_OVERRIDE: ChapterDraftSectionDefinition = {
  sectionId: "timeline",
  title: "Timeline",
  guidance: "Summarize the chronology of key moments using only dates/events mentioned in answers."
};

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

export function getSectionFrameworkForChapterKey(chapterKey: string): ChapterDraftSectionDefinition[] {
  const key = chapterKey.toLowerCase();
  const sections = [...BASE_SECTION_FRAMEWORK];

  if (includesAny(key, ["origin", "roots", "timeline"])) {
    sections.splice(2, 0, TIMELINE_SECTION_OVERRIDE);
  }

  if (includesAny(key, ["school", "college", "class"])) {
    sections.splice(2, 0, SCHOOL_SECTION_OVERRIDE);
  }

  if (includesAny(key, ["wedding", "marriage", "ceremony"])) {
    sections.splice(2, 0, WEDDING_SECTION_OVERRIDE);
  }

  return sections.map((section) => ({ ...section }));
}

export function getSectionFrameworkMapForChapterKeys(chapterKeys: string[]) {
  const map: Record<string, ChapterDraftSectionDefinition[]> = {};
  for (const chapterKey of chapterKeys) {
    map[chapterKey] = getSectionFrameworkForChapterKey(chapterKey);
  }
  return map;
}

export const DEFAULT_CHAPTER_SECTION_FRAMEWORK = BASE_SECTION_FRAMEWORK.map((section) => ({ ...section }));

