import { defaultFrameNodeStyleV1 } from "../nodes/frameNode";

export function buildCenteredPlaceholderFrameInput(options: {
  pageWidth: number;
  pageHeight: number;
}) {
  const { pageWidth, pageHeight } = options;
  const w = Math.min(pageWidth - 48, 300);
  const h = Math.min(pageHeight - 48, 200);
  return {
    type: "FRAME" as const,
    x: Math.max(16, Math.round((pageWidth - w) / 2)),
    y: Math.max(16, Math.round((pageHeight - h) / 2)),
    w,
    h,
    style: defaultFrameNodeStyleV1,
    content: {
      kind: "frame_node_v1",
      placeholderLabel: "Frame placeholder",
      imageRef: null
    }
  };
}
