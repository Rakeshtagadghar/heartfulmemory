import type { PdfRenderFrame } from "../../contracts";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderTextFrame(frame: PdfRenderFrame) {
  const style = frame.style ?? {};
  const text = typeof frame.content.text === "string" ? frame.content.text : "";
  const htmlText = text.includes("<") ? text : esc(text).replaceAll("\n", "<br/>");
  const fontFamily = style.fontFamily === "serif" ? "MemoriosoSerif, Georgia, serif" : "MemoriosoSans, Arial, sans-serif";
  const align = style.align === "center" || style.align === "right" ? style.align : "left";
  const color = typeof style.color === "string" ? style.color : "#1f2937";
  const fontSize = typeof style.fontSize === "number" ? style.fontSize : 15;
  const lineHeight = typeof style.lineHeight === "number" ? style.lineHeight : 1.45;
  const fontWeight = typeof style.fontWeight === "number" ? style.fontWeight : 400;

  return `
<div class="pdf-frame pdf-frame--text" data-frame-id="${esc(frame.id)}" style="left:${frame.x}px;top:${frame.y}px;width:${frame.w}px;height:${frame.h}px;z-index:${frame.zIndex};font-family:${fontFamily};font-size:${fontSize}px;line-height:${lineHeight};font-weight:${fontWeight};text-align:${align};color:${color};">
  <div style="width:100%;height:100%;padding:2px 4px;overflow:hidden;">${htmlText}</div>
</div>`;
}

