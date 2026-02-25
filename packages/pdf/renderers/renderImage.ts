import { normalizeCropModelV1 } from "../../editor/models/cropModel";
import type { RenderableAssetV1 } from "../contract/renderContractV1";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderImageNode(input: {
  node: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    opacity?: number;
    style?: Record<string, unknown>;
    content?: Record<string, unknown>;
    crop?: Record<string, unknown> | null;
  };
  assets: RenderableAssetV1[];
  clipRadiusPx?: number;
}) {
  const assetId = typeof input.node.content?.assetId === "string" ? input.node.content.assetId : null;
  const directSourceUrl = typeof input.node.content?.sourceUrl === "string" ? input.node.content.sourceUrl : null;
  const asset = assetId ? input.assets.find((value) => value.id === assetId) : null;
  // In server export, prefer the resolved/signed asset URL over editor preview URLs.
  const src = asset?.sourceUrl ?? directSourceUrl ?? "";
  const crop = normalizeCropModelV1(input.node.crop ?? undefined, { mode: "frame", objectFit: "cover" });
  const objectFit = crop.objectFit === "contain" ? "contain" : "cover";
  const objectPosition = `${Math.round(crop.panNorm.x * 100)}% ${Math.round(crop.panNorm.y * 100)}%`;
  const scale = crop.zoom;
  const rotation = crop.rotationDeg;
  return {
    html: `<div data-node-id="${esc(input.node.id)}" data-node-type="image" style="position:absolute;left:${input.node.x}px;top:${input.node.y}px;width:${input.node.w}px;height:${input.node.h}px;overflow:hidden;opacity:${input.node.opacity ?? 1};border-radius:${input.clipRadiusPx ?? 0}px;background:#efe6d0;">${
      src
        ? `<img src="${esc(src)}" alt="" style="width:100%;height:100%;display:block;object-fit:${objectFit};object-position:${objectPosition};transform:scale(${scale}) rotate(${rotation}deg);transform-origin:center center;" />`
        : `<div style="display:grid;place-items:center;width:100%;height:100%;font:12px sans-serif;color:#6b7280;">Missing image</div>`
    }</div>`
  };
}
