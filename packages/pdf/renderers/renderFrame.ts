import { normalizeFrameNodeContentV1, normalizeFrameNodeStyleV1 } from "../../editor/nodes/frameNode";
import type { RenderableAssetV1 } from "../contract/renderContractV1";
import { renderImageNode } from "./renderImage";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderFrameNode(input: {
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
}) {
  const style = normalizeFrameNodeStyleV1(input.node.style);
  const content = normalizeFrameNodeContentV1(input.node.content);
  const imageRef = content.imageRef ?? null;
  const imageHtml = imageRef
    ? renderImageNode({
        node: {
          ...input.node,
          x: 0,
          y: 0,
          content: {
            assetId: imageRef.assetId,
            sourceUrl: imageRef.sourceUrl ?? imageRef.previewUrl
          }
        },
        assets: input.assets,
        clipRadiusPx: Math.max(0, style.cornerRadius - style.strokeWidth)
      }).html
    : `<div style="position:absolute;inset:0;display:grid;place-items:center;color:#6b7280;font:12px sans-serif;">${esc(
        content.placeholderLabel ?? "Frame"
      )}</div>`;
  return {
    html: `<div data-node-id="${esc(input.node.id)}" data-node-type="frame" style="position:absolute;left:${input.node.x}px;top:${input.node.y}px;width:${input.node.w}px;height:${input.node.h}px;opacity:${input.node.opacity ?? style.opacity};border:${style.strokeWidth}px solid ${esc(style.stroke)};border-radius:${style.cornerRadius}px;background:${style.fill ?? "transparent"};overflow:hidden;">${imageHtml}</div>`
  };
}
