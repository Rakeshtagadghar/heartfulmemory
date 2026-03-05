/**
 * Maps Studio frame types to PptxGenJS slide elements.
 */
import type PptxGenJS from "pptxgenjs";
import { frameToPptxRect } from "./coordinateMap";

export type StudioFrame = {
  id: string;
  type: "TEXT" | "IMAGE" | "SHAPE" | "LINE" | "FRAME" | "GROUP";
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
  crop?: Record<string, unknown> | null;
};

export type ResolvedImage = {
  frameId: string;
  buffer: Buffer;
  mimeType: string;
};

export type NodeMapWarning = {
  frameId: string;
  type: string;
  message: string;
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function frameHasImageRef(frame: StudioFrame): boolean {
  if (frame.type !== "FRAME") return false;
  const content =
    frame.content && typeof frame.content === "object" && !Array.isArray(frame.content)
      ? (frame.content as Record<string, unknown>)
      : null;
  const imageRef =
    content?.imageRef && typeof content.imageRef === "object" && !Array.isArray(content.imageRef)
      ? (content.imageRef as Record<string, unknown>)
      : null;
  return Boolean(
    (typeof imageRef?.assetId === "string" && imageRef.assetId) ||
      (typeof imageRef?.sourceUrl === "string" && imageRef.sourceUrl) ||
      (typeof imageRef?.previewUrl === "string" && imageRef.previewUrl)
  );
}

function extractTextContent(frame: StudioFrame): string {
  const content = frame.content;
  if (!content) return "";
  // Plain text extraction: prefer plainText, then text, then extractFromRich
  if (typeof content.plainText === "string" && content.plainText) {
    return content.plainText;
  }
  if (typeof content.text === "string" && content.text) {
    return content.text;
  }
  return "";
}

function extractTextStyle(frame: StudioFrame): {
  fontSize: number;
  fontFace: string;
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right" | "justify";
} {
  const style = frame.style ?? {};
  const fontSizePx = asNumber(style.fontSize);
  const fontFamily = asNonEmptyString(style.fontFamily) ?? "Calibri";
  const color = asNonEmptyString(style.color) ?? "#1A1A1A";
  const boldFlag = asBoolean(style.bold);
  const fontWeight = asNonEmptyString(style.fontWeight) ?? asNumber(style.fontWeight);
  const italicFlag = asBoolean(style.italic);
  const fontStyle = asNonEmptyString(style.fontStyle);
  const textAlign = asNonEmptyString(style.textAlign) ?? undefined;

  const isBoldFromWeight =
    fontWeight === "bold" || (typeof fontWeight === "number" && Number.isFinite(fontWeight) && fontWeight >= 700);

  return {
    fontSize: fontSizePx !== null ? fontSizePx / 1.333 : 11, // px to pt approx
    fontFace: fontFamily,
    color: normalizeColor(color),
    bold: boldFlag ?? isBoldFromWeight,
    italic: italicFlag ?? fontStyle === "italic",
    align: normalizeAlign(textAlign),
  };
}

function normalizeColor(color: string): string {
  // Strip # prefix for PptxGenJS, and ensure 6-char hex
  const c = color.replace(/^#/, "");
  if (c.length === 3) {
    return c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  return c.slice(0, 6) || "1A1A1A";
}

function normalizeAlign(
  align?: string
): "left" | "center" | "right" | "justify" {
  switch (align) {
    case "center":
      return "center";
    case "right":
      return "right";
    case "justify":
      return "justify";
    default:
      return "left";
  }
}

export function addTextFrame(
  slide: PptxGenJS.Slide,
  frame: StudioFrame
): void {
  const text = extractTextContent(frame);
  if (!text) return;

  const rect = frameToPptxRect(frame);
  const textStyle = extractTextStyle(frame);

  slide.addText(text, {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    fontSize: textStyle.fontSize,
    fontFace: textStyle.fontFace,
    color: textStyle.color,
    bold: textStyle.bold,
    italic: textStyle.italic,
    align: textStyle.align,
    valign: "top",
    wrap: true,
    shrinkText: true,
  });
}

export function addImageFrame(
  slide: PptxGenJS.Slide,
  frame: StudioFrame,
  imageData: ResolvedImage
): void {
  const rect = frameToPptxRect(frame);

  slide.addImage({
    data: `data:${imageData.mimeType};base64,${imageData.buffer.toString("base64")}`,
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    sizing: { type: "cover", w: rect.w, h: rect.h },
  });
}

export function addShapeFrame(
  slide: PptxGenJS.Slide,
  frame: StudioFrame
): void {
  const rect = frameToPptxRect(frame);
  const style = frame.style ?? {};
  const fillColorRaw = asNonEmptyString(style.backgroundColor) ?? asNonEmptyString(style.fill) ?? "#FFFFFF";
  const borderColorRaw = asNonEmptyString(style.borderColor) ?? "#000000";
  const borderWidthRaw = asNumber(style.borderWidth);
  const fillColor = normalizeColor(
    fillColorRaw
  );
  const borderColor = normalizeColor(borderColorRaw);
  const borderWidth = borderWidthRaw !== null ? borderWidthRaw / 96 : 0;

  slide.addShape("rect", {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    fill: { color: fillColor },
    line: borderWidth > 0 ? { color: borderColor, width: borderWidth } : undefined,
  });
}

export function addLineFrame(
  slide: PptxGenJS.Slide,
  frame: StudioFrame
): void {
  const rect = frameToPptxRect(frame);
  const style = frame.style ?? {};
  const colorRaw = asNonEmptyString(style.strokeColor) ?? asNonEmptyString(style.color) ?? "#000000";
  const strokeWidthRaw = asNumber(style.strokeWidth);
  const color = normalizeColor(colorRaw);
  const width = strokeWidthRaw !== null ? strokeWidthRaw / 96 : 1 / 96;

  slide.addShape("line", {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    line: { color, width },
  });
}

/**
 * Add a frame to the slide. Returns a warning if the frame type is unsupported.
 */
export function addFrameToSlide(
  slide: PptxGenJS.Slide,
  frame: StudioFrame,
  resolvedImages: Map<string, ResolvedImage>
): NodeMapWarning | null {
  switch (frame.type) {
    case "TEXT":
      addTextFrame(slide, frame);
      return null;
    case "IMAGE": {
      const imgData = resolvedImages.get(frame.id);
      if (!imgData) {
        return {
          frameId: frame.id,
          type: frame.type,
          message: "Image asset not found or could not be fetched",
        };
      }
      addImageFrame(slide, frame, imgData);
      return null;
    }
    case "SHAPE":
      addShapeFrame(slide, frame);
      return null;
    case "LINE":
      addLineFrame(slide, frame);
      return null;
    case "FRAME":
      // If this frame has an imageRef and image data is resolved, render it as an image.
      {
        const imgData = resolvedImages.get(frame.id);
        if (imgData) {
          addImageFrame(slide, frame, imgData);
          return null;
        }

        addShapeFrame(slide, frame);
        if (frameHasImageRef(frame)) {
          return {
            frameId: frame.id,
            type: frame.type,
            message: "Frame image asset not found or could not be fetched",
          };
        }
        return null;
      }
    case "GROUP":
      // Skip groups in v1; children should be rendered individually
      return {
        frameId: frame.id,
        type: frame.type,
        message: "GROUP frames skipped in v1 PPTX export",
      };
    default:
      return {
        frameId: frame.id,
        type: frame.type,
        message: `Unsupported frame type: ${frame.type}`,
      };
  }
}
