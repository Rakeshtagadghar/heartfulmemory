export const starterTemplatesV1 = [
  {
    id: "childhood_roots",
    templateVersion: 1,
    name: "Childhood & Roots",
    shortDescription: "Capture early memories, home life, school days, and family traditions.",
    chapters: ["Origins", "Childhood Home", "School Days", "Family Traditions"]
  },
  {
    id: "love_family",
    templateVersion: 1,
    name: "Love & Family",
    shortDescription: "Document how a family began and the milestones that shaped it.",
    chapters: ["How We Met", "Wedding", "First Home", "Lessons of Love"]
  }
] as const;

export type StarterTemplateV1 = (typeof starterTemplatesV1)[number];
