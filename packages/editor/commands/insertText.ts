import type { TextNodeStyleV1 } from "../nodes/textNode";

export type TextPresetId = "heading" | "subheading" | "body" | "textbox";

export type TextInsertPreset = {
  id: TextPresetId;
  label: string;
  text: string;
  style: Partial<TextNodeStyleV1>;
  box: { w: number; h: number };
};

export const textInsertPresets: TextInsertPreset[] = [
  {
    id: "heading",
    label: "Add a heading",
    text: "Heading",
    style: { fontSize: 48, fontWeight: 700, lineHeight: 1.1 },
    box: { w: 520, h: 90 }
  },
  {
    id: "subheading",
    label: "Add a subheading",
    text: "Subheading",
    style: { fontSize: 28, fontWeight: 600, lineHeight: 1.2 },
    box: { w: 520, h: 70 }
  },
  {
    id: "body",
    label: "Add a little bit of body text",
    text: "Start writing your story here...",
    style: { fontSize: 16, fontWeight: 400, lineHeight: 1.4 },
    box: { w: 560, h: 140 }
  },
  {
    id: "textbox",
    label: "Add text box",
    text: "Edit this text…",
    style: { fontSize: 16, fontWeight: 400, lineHeight: 1.4 },
    box: { w: 420, h: 100 }
  }
];

export function getTextInsertPreset(id: TextPresetId) {
  return textInsertPresets.find((preset) => preset.id === id) ?? textInsertPresets[0];
}

export function buildCenteredTextFrameInput(options: {
  pageWidth: number;
  pageHeight: number;
  preset: TextInsertPreset;
  style: Record<string, unknown>;
}) {
  const { pageWidth, pageHeight, preset, style } = options;
  const w = Math.min(pageWidth - 48, Math.max(240, preset.box.w));
  const h = Math.min(pageHeight - 48, Math.max(56, preset.box.h));
  return {
    type: "TEXT" as const,
    x: Math.max(16, Math.round((pageWidth - w) / 2)),
    y: Math.max(16, Math.round((pageHeight - h) / 2)),
    w,
    h,
    style,
    content: {
      kind: "text_frame_v1",
      text: preset.text
    }
  };
}

