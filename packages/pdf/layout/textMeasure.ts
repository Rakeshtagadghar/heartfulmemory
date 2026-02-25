import { normalizeTextNodeStyleV1 } from "../../editor/nodes/textNode";

export type MeasuredTextLine = {
  text: string;
  widthPx: number;
};

export type MeasureTextBlockInput = {
  text: string;
  widthPx: number;
  style?: Record<string, unknown>;
};

export type MeasureTextBlockResult = {
  lines: MeasuredTextLine[];
  lineHeightPx: number;
  totalHeightPx: number;
};

export function estimateTextWidthPx(text: string, style?: Record<string, unknown>) {
  const normalized = normalizeTextNodeStyleV1(style);
  const fontSize = normalized.fontSize;
  const letterSpacing = normalized.letterSpacing;
  return Math.max(0, text.length * fontSize * 0.56 + Math.max(0, text.length - 1) * letterSpacing);
}

export function measureTextBlock(input: MeasureTextBlockInput): MeasureTextBlockResult {
  const normalized = normalizeTextNodeStyleV1(input.style);
  const words = input.text.replace(/\r\n/g, "\n").split(/(\s+)/);
  const lines: MeasuredTextLine[] = [];
  let current = "";
  for (const token of words) {
    if (token === "") continue;
    if (token.includes("\n")) {
      const split = token.split("\n");
      for (let i = 0; i < split.length; i += 1) {
        const part = split[i] ?? "";
        const next = `${current}${part}`;
        if (next && estimateTextWidthPx(next, normalized as unknown as Record<string, unknown>) > input.widthPx && current) {
          lines.push({ text: current, widthPx: estimateTextWidthPx(current, normalized as unknown as Record<string, unknown>) });
          current = part;
        } else {
          current = next;
        }
        if (i < split.length - 1) {
          lines.push({ text: current, widthPx: estimateTextWidthPx(current, normalized as unknown as Record<string, unknown>) });
          current = "";
        }
      }
      continue;
    }
    const next = `${current}${token}`;
    if (next && estimateTextWidthPx(next, normalized as unknown as Record<string, unknown>) > input.widthPx && current.trim()) {
      lines.push({ text: current, widthPx: estimateTextWidthPx(current, normalized as unknown as Record<string, unknown>) });
      current = token.trimStart();
    } else {
      current = next;
    }
  }
  if (current || lines.length === 0) {
    lines.push({ text: current, widthPx: estimateTextWidthPx(current, normalized as unknown as Record<string, unknown>) });
  }
  const lineHeightPx = normalized.fontSize * normalized.lineHeight;
  return {
    lines,
    lineHeightPx,
    totalHeightPx: lines.length * lineHeightPx
  };
}

