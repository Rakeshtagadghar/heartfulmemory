export const pageSizePresets = ["A4", "US_LETTER", "BOOK_6X9", "BOOK_8_5X11"] as const;
export type PageSizePreset = (typeof pageSizePresets)[number];

export type PageMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: "px";
};

export type PageGrid = {
  enabled: boolean;
  columns: number;
  gutter: number;
  rowHeight: number;
  showGuides: boolean;
};

export type PageBackground = {
  fill: string;
};

export type PageFrameType = "TEXT" | "IMAGE";

export type TextFrameStyle = {
  fontFamily: "serif" | "sans";
  fontSize: number;
  lineHeight: number;
  fontWeight: 400 | 500 | 600 | 700;
  color: string;
  align: "left" | "center" | "right";
};

export type ImageFrameStyle = {
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  shadow: "none" | "soft";
};

export type TextFrameContent = {
  kind: "text_frame_v1";
  text: string;
  overflow?: boolean;
};

export type ImageFrameContent = {
  kind: "image_frame_v1";
  caption: string;
  placeholderLabel?: string;
};

export type ImageCrop = {
  x: number;
  y: number;
  scale: number;
  focalX: number;
  focalY: number;
};

export type PageModel = {
  id: string;
  storybookId: string;
  orderIndex: number;
  sizePreset: PageSizePreset;
  widthPx: number;
  heightPx: number;
  margins: PageMargins;
  grid: PageGrid;
  background: PageBackground;
  createdAt: string;
  updatedAt: string;
};

export type FrameModel = {
  id: string;
  storybookId: string;
  pageId: string;
  ownerId: string;
  type: PageFrameType;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked: boolean;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
  crop: ImageCrop | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type PageSizePresetConfig = {
  preset: PageSizePreset;
  label: string;
  widthPx: number;
  heightPx: number;
  defaultMargins: PageMargins;
  defaultGrid: PageGrid;
};

export const pageSizePresetConfigs: Record<PageSizePreset, PageSizePresetConfig> = {
  A4: {
    preset: "A4",
    label: "A4",
    widthPx: 794,
    heightPx: 1123,
    defaultMargins: { top: 48, right: 48, bottom: 48, left: 48, unit: "px" },
    defaultGrid: { enabled: true, columns: 12, gutter: 12, rowHeight: 12, showGuides: true }
  },
  US_LETTER: {
    preset: "US_LETTER",
    label: "US Letter",
    widthPx: 816,
    heightPx: 1056,
    defaultMargins: { top: 48, right: 48, bottom: 48, left: 48, unit: "px" },
    defaultGrid: { enabled: true, columns: 12, gutter: 12, rowHeight: 12, showGuides: true }
  },
  BOOK_6X9: {
    preset: "BOOK_6X9",
    label: "Book 6x9",
    widthPx: 720,
    heightPx: 1080,
    defaultMargins: { top: 40, right: 44, bottom: 44, left: 52, unit: "px" },
    defaultGrid: { enabled: true, columns: 6, gutter: 12, rowHeight: 12, showGuides: true }
  },
  BOOK_8_5X11: {
    preset: "BOOK_8_5X11",
    label: "Book 8.5x11",
    widthPx: 816,
    heightPx: 1056,
    defaultMargins: { top: 44, right: 44, bottom: 44, left: 44, unit: "px" },
    defaultGrid: { enabled: true, columns: 8, gutter: 12, rowHeight: 12, showGuides: true }
  }
};

export function getPageSizePresetConfig(preset: PageSizePreset): PageSizePresetConfig {
  return pageSizePresetConfigs[preset];
}

