import type { PdfRenderContract, PdfRenderWarning } from "./contracts";

export function estimateOverflowWarnings(contract: PdfRenderContract): PdfRenderWarning[] {
  const warnings: PdfRenderWarning[] = [];

  for (const frame of contract.frames) {
    if (frame.type !== "TEXT") continue;
    const text = typeof frame.content.text === "string" ? frame.content.text : "";
    const fontSize = typeof frame.style.fontSize === "number" ? frame.style.fontSize : 15;
    const lineHeight = typeof frame.style.lineHeight === "number" ? frame.style.lineHeight : 1.45;
    const approxCharsPerLine = Math.max(8, Math.floor(frame.w / Math.max(8, fontSize * 0.55)));
    const approxLines = Math.ceil(Math.max(1, text.length) / approxCharsPerLine);
    const maxLines = Math.max(1, Math.floor(frame.h / Math.max(10, fontSize * lineHeight)));

    if (approxLines > maxLines) {
      warnings.push({
        code: "TEXT_OVERFLOW",
        pageId: frame.pageId,
        frameId: frame.id,
        message: "Text may overflow this frame in PDF output.",
        severity: "warning"
      });
    }
  }

  return warnings;
}

