export type PageTemplateFrameBlueprint = {
  type: "TEXT" | "IMAGE";
  x: number;
  y: number;
  w: number;
  h: number;
  z_index: number;
  locked?: boolean;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
};

export type PageTemplateBlueprint = {
  id: string;
  name: string;
  description: string;
  frames: PageTemplateFrameBlueprint[];
};

export const eldersFirstPageTemplates: readonly PageTemplateBlueprint[] = [
  {
    id: "cover_hero_split_v1",
    name: "Cover Hero Split",
    description: "Title stack + hero image + short intro.",
    frames: [
      {
        type: "TEXT",
        x: 56,
        y: 56,
        w: 420,
        h: 130,
        z_index: 1,
        style: {
          fontFamily: "serif",
          fontSize: 34,
          lineHeight: 1.1,
          fontWeight: 700,
          color: "#1d2432",
          align: "left"
        },
        content: { kind: "text_frame_v1", text: "Family Name Storybook" }
      },
      {
        type: "IMAGE",
        x: 492,
        y: 56,
        w: 268,
        h: 300,
        z_index: 2,
        style: { borderRadius: 16, borderColor: "#d5bf8a", borderWidth: 1, shadow: "soft" },
        content: { kind: "image_frame_v1", caption: "Cover portrait", placeholderLabel: "Hero photo" }
      },
      {
        type: "TEXT",
        x: 56,
        y: 216,
        w: 420,
        h: 140,
        z_index: 3,
        style: {
          fontFamily: "sans",
          fontSize: 15,
          lineHeight: 1.5,
          fontWeight: 400,
          color: "#293041",
          align: "left"
        },
        content: {
          kind: "text_frame_v1",
          text: "A keepsake of voices, milestones, and memories preserved for future generations."
        }
      }
    ]
  },
  {
    id: "chapter_opener_v1",
    name: "Chapter Opener",
    description: "Large chapter title with full-width hero image and pull quote.",
    frames: [
      {
        type: "IMAGE",
        x: 56,
        y: 56,
        w: 704,
        h: 320,
        z_index: 1,
        style: { borderRadius: 18, borderColor: "#d5bf8a", borderWidth: 1, shadow: "soft" },
        content: { kind: "image_frame_v1", caption: "Chapter hero", placeholderLabel: "Hero image" }
      },
      {
        type: "TEXT",
        x: 56,
        y: 402,
        w: 420,
        h: 90,
        z_index: 2,
        style: { fontFamily: "serif", fontSize: 30, lineHeight: 1.15, fontWeight: 700, color: "#1d2432", align: "left" },
        content: { kind: "text_frame_v1", text: "Chapter Title" }
      },
      {
        type: "TEXT",
        x: 492,
        y: 402,
        w: 268,
        h: 120,
        z_index: 3,
        style: { fontFamily: "sans", fontSize: 14, lineHeight: 1.45, fontWeight: 500, color: "#2f3748", align: "left" },
        content: { kind: "text_frame_v1", text: "“A short quote or scene-setting line.”" }
      }
    ]
  },
  {
    id: "story_70_30_v1",
    name: "Story 70/30",
    description: "Narrative text with companion image block.",
    frames: [
      {
        type: "TEXT",
        x: 56,
        y: 56,
        w: 500,
        h: 620,
        z_index: 1,
        style: { fontFamily: "sans", fontSize: 15, lineHeight: 1.52, fontWeight: 400, color: "#293041", align: "left" },
        content: { kind: "text_frame_v1", text: "Write the memory here. Include details, feelings, and context." }
      },
      {
        type: "IMAGE",
        x: 576,
        y: 56,
        w: 184,
        h: 250,
        z_index: 2,
        style: { borderRadius: 12, borderColor: "#d5bf8a", borderWidth: 1, shadow: "soft" },
        content: { kind: "image_frame_v1", caption: "Moment snapshot", placeholderLabel: "Image" }
      },
      {
        type: "TEXT",
        x: 576,
        y: 326,
        w: 184,
        h: 140,
        z_index: 3,
        style: { fontFamily: "sans", fontSize: 12, lineHeight: 1.4, fontWeight: 500, color: "#465066", align: "left" },
        content: { kind: "text_frame_v1", text: "Caption, date, and names." }
      }
    ]
  }
];

