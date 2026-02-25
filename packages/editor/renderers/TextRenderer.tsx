import { memo } from "react";
import type { TextNodeStyleV1 } from "../nodes/textNode";

function getFontFamilyCss(fontFamily: TextNodeStyleV1["fontFamily"]) {
  if (fontFamily === "Inter") return "Inter, ui-sans-serif, system-ui";
  if (fontFamily === "Georgia") return "Georgia, serif";
  if (fontFamily === "Times New Roman") return "'Times New Roman', serif";
  return "Arial, sans-serif";
}

function TextRendererInner({
  text,
  style
}: {
  text: string;
  style: TextNodeStyleV1;
}) {
  return (
    <div
      className="h-full whitespace-pre-wrap break-words"
      style={{
        fontFamily: getFontFamilyCss(style.fontFamily),
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        textDecoration: style.textDecoration,
        letterSpacing: `${style.letterSpacing}px`,
        textAlign: style.textAlign,
        color: style.color,
        opacity: style.opacity
      }}
    >
      {text}
    </div>
  );
}

export const TextRenderer = memo(TextRendererInner, (prev, next) => {
  return (
    prev.text === next.text &&
    prev.style.fontFamily === next.style.fontFamily &&
    prev.style.fontSize === next.style.fontSize &&
    prev.style.fontWeight === next.style.fontWeight &&
    prev.style.fontStyle === next.style.fontStyle &&
    prev.style.textDecoration === next.style.textDecoration &&
    prev.style.lineHeight === next.style.lineHeight &&
    prev.style.letterSpacing === next.style.letterSpacing &&
    prev.style.textAlign === next.style.textAlign &&
    prev.style.color === next.style.color &&
    prev.style.opacity === next.style.opacity
  );
});

