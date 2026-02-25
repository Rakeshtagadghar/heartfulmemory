export type StudioToolSelectionContext = {
  selectedFrameType: "TEXT" | "IMAGE" | "SHAPE" | "LINE" | "FRAME" | "GROUP" | null;
  cropModeActive: boolean;
  textEditActive: boolean;
};

export type StudioToolDefinition = {
  id: string;
  title: string;
  group: "global" | "context";
  description: string;
  available: (ctx: StudioToolSelectionContext) => boolean;
};

export const studioToolRegistry: StudioToolDefinition[] = [
  {
    id: "canvas_guides",
    title: "Guides & Grid",
    group: "global",
    description: "Toggle grid, margins, and safe-area overlays.",
    available: () => true
  },
  {
    id: "image_crop",
    title: "Image Crop",
    group: "context",
    description: "Crop and position the selected image.",
    available: (ctx) => ctx.selectedFrameType === "IMAGE"
  },
  {
    id: "text_style",
    title: "Text Style",
    group: "context",
    description: "Adjust typography for the selected text frame.",
    available: (ctx) => ctx.selectedFrameType === "TEXT"
  },
  {
    id: "crop_mode",
    title: "Crop Mode",
    group: "context",
    description: "Shows when image crop mode is active.",
    available: (ctx) => ctx.cropModeActive
  },
  {
    id: "text_editing",
    title: "Text Editing",
    group: "context",
    description: "Shows when inline text editing is active.",
    available: (ctx) => ctx.textEditActive
  }
];

export function getAvailableStudioTools(ctx: StudioToolSelectionContext) {
  return studioToolRegistry.filter((tool) => tool.available(ctx));
}
