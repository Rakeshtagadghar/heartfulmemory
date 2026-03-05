import {
  AlignmentType,
  HeadingLevel,
  type IParagraphOptions,
  type IRunOptions,
  convertInchesToTwip,
} from "docx";

/** Font families */
export const HEADING_FONT = "Cambria";
export const BODY_FONT = "Calibri";

/** Colors */
export const COLOR_BODY = "1A1A1A";
export const COLOR_MUTED = "666666";

/** Page setup (Letter 8.5x11, 1" margins) */
export const PAGE_WIDTH_TWIPS = convertInchesToTwip(8.5);
export const PAGE_HEIGHT_TWIPS = convertInchesToTwip(11);
export const MARGIN_TWIPS = convertInchesToTwip(1);
export const CONTENT_WIDTH_INCHES = 6.5; // 8.5 - 2*1

/** Max image width in EMU (inches * 914400) */
export const MAX_IMAGE_WIDTH_EMU = Math.round(5.5 * 914400);
/** Max image height in EMU to avoid page overflow for very tall images */
export const MAX_IMAGE_HEIGHT_EMU = Math.round(7.25 * 914400);

export const titleRun: IRunOptions = {
  font: HEADING_FONT,
  size: 56, // 28pt in half-points
  bold: true,
  color: COLOR_BODY,
};

export const subtitleRun: IRunOptions = {
  font: HEADING_FONT,
  size: 32,
  italics: true,
  color: COLOR_BODY,
};

export const authorRun: IRunOptions = {
  font: HEADING_FONT,
  size: 24,
  color: COLOR_BODY,
};

export const dateRun: IRunOptions = {
  font: HEADING_FONT,
  size: 22,
  color: COLOR_MUTED,
};

export const titleParagraph: IParagraphOptions = {
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
};

export const chapterHeadingOptions: IParagraphOptions = {
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 480, after: 240 },
  pageBreakBefore: true,
};

export const bodyParagraphOptions: IParagraphOptions = {
  spacing: { before: 120, after: 120 },
};

export const bodyRunOptions: IRunOptions = {
  font: BODY_FONT,
  size: 22, // 11pt
  color: COLOR_BODY,
};

export const captionParagraphOptions: IParagraphOptions = {
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 120 },
};

export const captionRunOptions: IRunOptions = {
  font: BODY_FONT,
  size: 18, // 9pt
  italics: true,
  color: COLOR_MUTED,
};

export const creditsHeadingOptions: IParagraphOptions = {
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 480, after: 240 },
  pageBreakBefore: true,
};

export const creditsRunOptions: IRunOptions = {
  font: BODY_FONT,
  size: 18,
  color: COLOR_BODY,
};
