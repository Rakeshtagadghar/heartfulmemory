export type ExportTarget = "DIGITAL_PDF" | "HARDCOPY_PRINT_PDF";

export type PdfWarningCode =
  | "TEXT_OVERFLOW"
  | "LOW_RES_IMAGE"
  | "FRAME_OUTSIDE_SAFE_AREA"
  | "IMAGE_MISSING";

export type PdfRenderWarning = {
  code: PdfWarningCode;
  pageId: string;
  frameId?: string;
  message: string;
  severity: "info" | "warning";
};

export type PdfRenderMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: "px";
};

export type PdfRenderGrid = {
  enabled: boolean;
  columns: number;
  gutter: number;
  rowHeight: number;
  showGuides: boolean;
};

export type PdfRenderPage = {
  id: string;
  orderIndex: number;
  sizePreset: "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11";
  widthPx: number;
  heightPx: number;
  margins: PdfRenderMargins;
  grid: PdfRenderGrid;
  background: { fill: string };
};

export type PdfRenderFrame = {
  id: string;
  pageId: string;
  type: "TEXT" | "IMAGE";
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked: boolean;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
  crop: Record<string, unknown> | null;
  version: number;
};

export type PdfRenderStorybook = {
  id: string;
  title: string;
  subtitle: string | null;
  updatedAt: string;
  settings: Record<string, unknown>;
};

export type PdfRenderContract = {
  storybook: PdfRenderStorybook;
  exportTarget: ExportTarget;
  pages: PdfRenderPage[];
  frames: PdfRenderFrame[];
  assets: Array<{
    id: string;
    sourceUrl?: string | null;
    width?: number | null;
    height?: number | null;
    mimeType?: string | null;
  }>;
};

export type PdfRenderOutputMeta = {
  pageCount: number;
  exportHash: string;
  warnings: PdfRenderWarning[];
};

export type PdfRenderOutput = {
  pdf: Buffer;
  meta: PdfRenderOutputMeta;
};

