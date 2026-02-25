import { defaultLineNodeStyleV1 } from "../nodes/lineNode";

export function buildCenteredLineFrameInput(options: {
  pageWidth: number;
  pageHeight: number;
}) {
  const { pageWidth, pageHeight } = options;
  const w = Math.min(pageWidth - 48, 240);
  const h = 24;
  return {
    type: "LINE" as const,
    x: Math.max(16, Math.round((pageWidth - w) / 2)),
    y: Math.max(16, Math.round((pageHeight - h) / 2)),
    w,
    h,
    style: defaultLineNodeStyleV1,
    content: { kind: "line_node_v1" }
  };
}
