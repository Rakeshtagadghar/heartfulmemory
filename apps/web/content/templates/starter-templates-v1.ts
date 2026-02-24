export const starterTemplatesV1 = [
  {
    id: "childhood_roots",
    templateVersion: 1,
    name: "Childhood & Roots",
    chapters: ["Origins", "Childhood Home", "School Days", "Family Traditions"]
  },
  {
    id: "love_family",
    templateVersion: 1,
    name: "Love & Family",
    chapters: ["How We Met", "Wedding", "First Home", "Lessons of Love"]
  }
] as const;

export type StarterTemplateV1 = (typeof starterTemplatesV1)[number];

