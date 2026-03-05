import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  PageBreak,
  AlignmentType,
  convertInchesToTwip,
} from "docx";
import {
  titleRun,
  subtitleRun,
  authorRun,
  dateRun,
  titleParagraph,
  chapterHeadingOptions,
  bodyParagraphOptions,
  bodyRunOptions,
  captionParagraphOptions,
  captionRunOptions,
  creditsHeadingOptions,
  creditsRunOptions,
  HEADING_FONT,
  COLOR_BODY,
  MARGIN_TWIPS,
  MAX_IMAGE_WIDTH_EMU,
  MAX_IMAGE_HEIGHT_EMU,
} from "./styles";

export type DocxChapter = {
  title: string;
  orderIndex: number;
  paragraphs: string[];
};

export type DocxImage = {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType?: string;
  caption?: string;
  credit?: string;
};

export type DocxInput = {
  title: string;
  subtitle?: string | null;
  authorName?: string | null;
  chapters: DocxChapter[];
  /** Images spread across chapters by index */
  images: DocxImage[];
};

/**
 * Map images to chapters round-robin.
 * Returns a Map<chapterIndex, DocxImage[]>
 */
function mapImagesToChapters(
  images: DocxImage[],
  chapterCount: number
): Map<number, DocxImage[]> {
  const map = new Map<number, DocxImage[]>();
  if (chapterCount === 0) return map;
  for (let i = 0; i < images.length; i++) {
    const chapterIdx = i % chapterCount;
    const existing = map.get(chapterIdx) ?? [];
    existing.push(images[i]);
    map.set(chapterIdx, existing);
  }
  return map;
}

const PX_PER_INCH = 96;
const CONTENT_HEIGHT_PX = Math.round((11 - 2) * PX_PER_INCH); // Letter height minus 1" top/bottom margins
const CONTENT_WIDTH_PX = Math.round(6.5 * PX_PER_INCH);
const CHAPTER_HEADING_ESTIMATE_PX = 88;
const BODY_FONT_PX = 11 * (PX_PER_INCH / 72);
const BODY_LINE_HEIGHT_PX = BODY_FONT_PX * 1.35;
const BODY_PARAGRAPH_VERTICAL_PADDING_PX = 18;
const IMAGE_BLOCK_VERTICAL_SPACING_PX = 36;
const CAPTION_BLOCK_ESTIMATE_PX = 26;

function detectDocxImageType(buffer: Buffer): "png" | "jpg" | "gif" | "bmp" | null {
  if (buffer.length >= 8) {
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    if (isPng) return "png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString("ascii");
    if (header === "GIF87a" || header === "GIF89a") return "gif";
  }
  if (buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "bmp";
  }
  return null;
}

function toDocxImageType(img: DocxImage): "png" | "jpg" | "gif" | "bmp" {
  const mime = (img.mimeType ?? "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("bmp")) return "bmp";
  return detectDocxImageType(img.buffer) ?? "png";
}

function getImageDimensionsPx(img: DocxImage): { width: number; height: number } {
  const safeWidth = img.width > 0 ? img.width : 400;
  const safeHeight = img.height > 0 ? img.height : 300;
  const aspectRatio = safeWidth / safeHeight;
  let widthEmu = safeWidth * (914400 / 96); // px to EMU at 96 DPI
  let heightEmu = safeHeight * (914400 / 96);

  if (widthEmu > MAX_IMAGE_WIDTH_EMU) {
    widthEmu = MAX_IMAGE_WIDTH_EMU;
    heightEmu = widthEmu / aspectRatio;
  }
  if (heightEmu > MAX_IMAGE_HEIGHT_EMU) {
    heightEmu = MAX_IMAGE_HEIGHT_EMU;
    widthEmu = heightEmu * aspectRatio;
  }

  return {
    width: Math.max(1, Math.round((widthEmu / 914400) * PX_PER_INCH)),
    height: Math.max(1, Math.round((heightEmu / 914400) * PX_PER_INCH)),
  };
}

function estimateParagraphHeightPx(text: string): number {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return BODY_PARAGRAPH_VERTICAL_PADDING_PX;

  const avgCharWidthPx = BODY_FONT_PX * 0.52;
  const charsPerLine = Math.max(28, Math.floor(CONTENT_WIDTH_PX / avgCharWidthPx));
  const lines = normalized
    .split("\n")
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);

  return Math.round(lines * BODY_LINE_HEIGHT_PX + BODY_PARAGRAPH_VERTICAL_PADDING_PX);
}

function estimateImageBlockHeightPx(img: DocxImage, hasCaption: boolean): number {
  const dimensions = getImageDimensionsPx(img);
  return (
    dimensions.height +
    IMAGE_BLOCK_VERTICAL_SPACING_PX +
    (hasCaption ? CAPTION_BLOCK_ESTIMATE_PX : 0)
  );
}

function applyOverflowPageBreak(
  remainingPagePx: number,
  blockHeightPx: number
): { pageBreakBefore: boolean; remainingPagePx: number } {
  const pageCapacityPx = CONTENT_HEIGHT_PX;
  const needsBreak = blockHeightPx > remainingPagePx && remainingPagePx < pageCapacityPx;
  const startingBudget = needsBreak ? pageCapacityPx : remainingPagePx;
  const consumed = Math.min(blockHeightPx, pageCapacityPx);
  return {
    pageBreakBefore: needsBreak,
    remainingPagePx: Math.max(0, startingBudget - consumed),
  };
}

function buildImageRun(img: DocxImage): ImageRun {
  const dimensions = getImageDimensionsPx(img);
  return new ImageRun({
    data: img.buffer,
    transformation: {
      width: dimensions.width,
      height: dimensions.height,
    },
    type: toDocxImageType(img),
  });
}

function buildTitlePage(input: DocxInput): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Spacer
  paragraphs.push(new Paragraph({ spacing: { before: 2400 } }));

  // Title
  paragraphs.push(
    new Paragraph({
      ...titleParagraph,
      children: [new TextRun({ ...titleRun, text: input.title })],
    })
  );

  // Subtitle
  if (input.subtitle) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ ...subtitleRun, text: input.subtitle })],
      })
    );
  }

  // Author
  if (input.authorName) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ ...authorRun, text: input.authorName })],
      })
    );
  }

  // Date
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ ...dateRun, text: dateStr })],
    })
  );

  return paragraphs;
}

function buildChapterSection(
  chapter: DocxChapter,
  chapterImages: DocxImage[],
  isFirst: boolean
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  let remainingPagePx = Math.max(120, CONTENT_HEIGHT_PX - CHAPTER_HEADING_ESTIMATE_PX);

  // Chapter heading (first chapter follows explicit title-page break).
  paragraphs.push(
    new Paragraph({
      ...chapterHeadingOptions,
      pageBreakBefore: !isFirst,
      keepNext: true,
      children: [
        new TextRun({
          font: HEADING_FONT,
          size: 44,
          bold: true,
          color: COLOR_BODY,
          text: chapter.title,
        }),
      ],
    })
  );

  // Body paragraphs
  for (const text of chapter.paragraphs) {
    if (!text.trim()) continue;
    const blockHeightPx = estimateParagraphHeightPx(text);
    const placement = applyOverflowPageBreak(remainingPagePx, blockHeightPx);
    remainingPagePx = placement.remainingPagePx;

    paragraphs.push(
      new Paragraph({
        ...bodyParagraphOptions,
        pageBreakBefore: placement.pageBreakBefore,
        keepLines: blockHeightPx <= CONTENT_HEIGHT_PX * 0.92,
        widowControl: true,
        children: [new TextRun({ ...bodyRunOptions, text })],
      })
    );
  }

  // Images for this chapter
  for (const img of chapterImages) {
    const hasCaption = Boolean(img.caption || img.credit);
    const blockHeightPx = estimateImageBlockHeightPx(img, hasCaption);
    const placement = applyOverflowPageBreak(remainingPagePx, blockHeightPx);
    remainingPagePx = placement.remainingPagePx;

    // Image paragraph
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        pageBreakBefore: placement.pageBreakBefore,
        keepNext: hasCaption,
        keepLines: true,
        widowControl: true,
        children: [buildImageRun(img)],
      })
    );

    // Caption
    if (img.caption || img.credit) {
      paragraphs.push(
        new Paragraph({
          ...captionParagraphOptions,
          keepLines: true,
          widowControl: true,
          children: [
            new TextRun({
              ...captionRunOptions,
              text: img.caption || img.credit || "",
            }),
          ],
        })
      );
    }
  }

  return paragraphs;
}

function buildCreditsSection(images: DocxImage[]): Paragraph[] {
  const credits = images
    .filter((img) => img.credit)
    .map((img) => img.credit!);

  if (credits.length === 0) return [];

  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      ...creditsHeadingOptions,
      children: [
        new TextRun({
          font: HEADING_FONT,
          size: 28,
          bold: true,
          color: COLOR_BODY,
          text: "Photo Credits",
        }),
      ],
    })
  );

  for (const credit of credits) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ ...creditsRunOptions, text: credit })],
      })
    );
  }

  return paragraphs;
}

export async function generateDocx(input: DocxInput): Promise<Buffer> {
  const allParagraphs: Paragraph[] = [];

  // Title page
  allParagraphs.push(...buildTitlePage(input));
  if (input.chapters.length > 0) {
    allParagraphs.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // Map images to chapters
  const imageMap = mapImagesToChapters(input.images, input.chapters.length);

  // Chapter sections
  for (let i = 0; i < input.chapters.length; i++) {
    const chapter = input.chapters[i];
    const chapterImages = imageMap.get(i) ?? [];
    allParagraphs.push(...buildChapterSection(chapter, chapterImages, i === 0));
  }

  // Credits
  allParagraphs.push(...buildCreditsSection(input.images));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(11),
            },
            margin: {
              top: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
            },
          },
        },
        children: allParagraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

/**
 * Deterministic ordering of chapters for DOCX export.
 * Exported for testing.
 */
export function orderChaptersForDocx<
  T extends { orderIndex: number; title: string }
>(chapters: T[]): T[] {
  return [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
}
