export const typographyScale = {
  h1: { fontSize: 36, lineHeight: 1.15, maxCharsPerLine: 26 },
  h2: { fontSize: 24, lineHeight: 1.2, maxCharsPerLine: 36 },
  body: { fontSize: 15, lineHeight: 1.45, maxCharsPerLine: 58 },
  caption: { fontSize: 12, lineHeight: 1.35, maxCharsPerLine: 42 }
} as const;

export function estimateTextOverflow({
  text,
  widthPx,
  heightPx,
  fontSize,
  lineHeight
}: {
  text: string;
  widthPx: number;
  heightPx: number;
  fontSize: number;
  lineHeight: number;
}) {
  const approxCharsPerLine = Math.max(8, Math.floor(widthPx / Math.max(7, fontSize * 0.55)));
  const approxLines = Math.ceil(Math.max(1, text.length) / approxCharsPerLine);
  const maxLines = Math.max(1, Math.floor(heightPx / Math.max(10, fontSize * lineHeight)));
  return {
    approxCharsPerLine,
    approxLines,
    maxLines,
    overflow: approxLines > maxLines
  };
}

