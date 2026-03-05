import PptxGenJS from "pptxgenjs";
import { pageSizeToInches } from "./coordinateMap";
import {
  addFrameToSlide,
  type StudioFrame,
  type ResolvedImage,
  type NodeMapWarning,
} from "./nodeMappers";

export type PptxPage = {
  id: string;
  widthPx: number;
  heightPx: number;
  background: { fill: string };
  orderIndex: number;
  isHidden?: boolean;
};

export type PptxInput = {
  title: string;
  pages: PptxPage[];
  /** Frames grouped by pageId */
  framesByPage: Map<string, StudioFrame[]>;
  /** Resolved image data keyed by frameId */
  resolvedImages: Map<string, ResolvedImage>;
};

export type PptxOutput = {
  buffer: Buffer;
  warnings: NodeMapWarning[];
  slideCount: number;
};

function normalizeHexColor(color: string): string {
  const c = color.replace(/^#/, "");
  if (c.length === 3) {
    return c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  return c.slice(0, 6) || "FFFFFF";
}

export async function generatePptx(input: PptxInput): Promise<PptxOutput> {
  const pptx = new PptxGenJS();
  pptx.title = input.title;
  pptx.author = "Memorioso";

  // Filter out hidden pages
  const visiblePages = input.pages
    .filter((p) => !p.isHidden)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (visiblePages.length === 0) {
    throw new Error("No visible pages to export");
  }

  // Set slide dimensions from first page
  const firstPage = visiblePages[0];
  const slideSize = pageSizeToInches(firstPage);
  pptx.defineLayout({
    name: "CUSTOM",
    width: slideSize.width,
    height: slideSize.height,
  });
  pptx.layout = "CUSTOM";

  const allWarnings: NodeMapWarning[] = [];

  // Process each page as a slide
  for (const page of visiblePages) {
    const slide = pptx.addSlide();

    // Background
    const bgColor = normalizeHexColor(page.background?.fill ?? "#FFFFFF");
    slide.background = { fill: bgColor };

    // Get frames for this page, sorted by zIndex
    const frames = input.framesByPage.get(page.id) ?? [];
    const sortedFrames = [...frames].sort((a, b) => a.zIndex - b.zIndex);

    for (const frame of sortedFrames) {
      const warning = addFrameToSlide(
        slide,
        frame,
        input.resolvedImages
      );
      if (warning) {
        allWarnings.push(warning);
      }
    }
  }

  // Generate buffer
  const arrayBuffer = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer;
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    warnings: allWarnings,
    slideCount: visiblePages.length,
  };
}

/**
 * Filter hidden pages from export (matches PDF policy).
 * Exported for testing.
 */
export function filterVisiblePages<T extends { isHidden?: boolean }>(
  pages: T[]
): T[] {
  return pages.filter((p) => !p.isHidden);
}
