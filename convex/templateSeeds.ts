export const templateSeedsV1 = [
  {
    templateId: "childhood_roots",
    templateVersion: 1,
    name: "Childhood & Roots",
    chapters: ["Origins", "Childhood Home", "School Days", "Family Traditions"]
  },
  {
    templateId: "love_family",
    templateVersion: 1,
    name: "Love & Family",
    chapters: ["How We Met", "Wedding", "First Home", "Lessons of Love"]
  }
] as const;

export type TemplateSeedV1 = (typeof templateSeedsV1)[number];

export function getTemplateSeedById(templateId: string) {
  return templateSeedsV1.find((template) => template.templateId === templateId) ?? null;
}

