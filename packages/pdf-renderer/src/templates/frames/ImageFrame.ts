import type { PdfRenderContract, PdfRenderFrame, PdfRenderWarning } from "../../contracts";
import { focalPointToObjectPosition } from "../../cropMath";
import { resolveFrameImage } from "../../imageResolver";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderImageFrame(
  contract: PdfRenderContract,
  frame: PdfRenderFrame
): { html: string; warnings: PdfRenderWarning[] } {
  const { image, warnings } = resolveFrameImage(contract, frame);
  const style = frame.style ?? {};
  const borderRadius = typeof style.borderRadius === "number" ? style.borderRadius : 0;
  const borderWidth = typeof style.borderWidth === "number" ? style.borderWidth : 0;
  const borderColor = typeof style.borderColor === "string" ? style.borderColor : "transparent";
  const focal = frame.crop && typeof frame.crop === "object" ? (frame.crop as { focalX?: number; focalY?: number }) : null;
  const objectPosition = focalPointToObjectPosition({ x: focal?.focalX, y: focal?.focalY });
  const caption = typeof frame.content.caption === "string" ? frame.content.caption : "";

  const html = `
<div class="pdf-frame pdf-frame--image" data-frame-id="${esc(frame.id)}" style="left:${frame.x}px;top:${frame.y}px;width:${frame.w}px;height:${frame.h}px;z-index:${frame.zIndex};border-radius:${borderRadius}px;border:${borderWidth}px solid ${borderColor};">
  ${
    image.src
      ? `<img class="pdf-frame__img" src="${esc(image.src)}" alt="${esc(caption || "Storybook image")}" style="object-position:${objectPosition};border-radius:${Math.max(0, borderRadius - borderWidth)}px;" />`
      : `<div class="pdf-frame__placeholder">Image</div>`
  }
</div>`;

  return { html, warnings };
}

