export type TextAlign = "left" | "center" | "right" | "justify";
export type TextFontFamily = "Inter" | "Arial" | "Georgia" | "Times New Roman";

export type TextNodeStyleV1 = {
  fontFamily: TextFontFamily;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  color: string;
  backgroundColor?: string | null;
  opacity?: number;
};

export const defaultTextNodeStyleV1: TextNodeStyleV1 = {
  fontFamily: "Inter",
  fontSize: 16,
  fontWeight: 400,
  fontStyle: "normal",
  textDecoration: "none",
  lineHeight: 1.4,
  letterSpacing: 0,
  textAlign: "left",
  color: "#1f2633",
  backgroundColor: null,
  opacity: 1
};

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function normalizeTextNodeStyleV1(
  style: Record<string, unknown> | null | undefined
): TextNodeStyleV1 {
  const input = style ?? {};
  const fontFamily =
    input.fontFamily === "Inter" ||
    input.fontFamily === "Arial" ||
    input.fontFamily === "Georgia" ||
    input.fontFamily === "Times New Roman"
      ? input.fontFamily
      : defaultTextNodeStyleV1.fontFamily;

  const textAlignInput = input.textAlign ?? input.align;
  const textAlign =
    textAlignInput === "center" || textAlignInput === "right" || textAlignInput === "left" || textAlignInput === "justify"
      ? textAlignInput
      : defaultTextNodeStyleV1.textAlign;

  return {
    fontFamily,
    fontSize: clampNumber(input.fontSize, defaultTextNodeStyleV1.fontSize, 8, 240),
    fontWeight: clampNumber(input.fontWeight, defaultTextNodeStyleV1.fontWeight, 100, 900),
    fontStyle: input.fontStyle === "italic" ? "italic" : "normal",
    textDecoration: (["underline", "line-through"] as const).includes(input.textDecoration as "underline" | "line-through")
      ? (input.textDecoration as "underline" | "line-through")
      : "none",
    lineHeight: clampNumber(input.lineHeight, defaultTextNodeStyleV1.lineHeight, 0.8, 3),
    letterSpacing: clampNumber(input.letterSpacing, defaultTextNodeStyleV1.letterSpacing, -2, 20),
    textAlign,
    color: typeof input.color === "string" && input.color.trim() ? input.color : defaultTextNodeStyleV1.color,
    backgroundColor:
      typeof input.backgroundColor === "string" ? input.backgroundColor : defaultTextNodeStyleV1.backgroundColor,
    opacity: clampNumber(input.opacity, defaultTextNodeStyleV1.opacity ?? 1, 0, 1)
  };
}

export function getTextNodePlainText(content: Record<string, unknown> | null | undefined) {
  const value = content?.text;
  return typeof value === "string" ? value : "";
}

