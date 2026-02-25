import type { ShapeKind } from "../nodes/shapeNode";
import { defaultShapeNodeStyleV1 } from "../nodes/shapeNode";

export function buildCenteredShapeFrameInput(options: {
  pageWidth: number;
  pageHeight: number;
  shapeType: ShapeKind;
}) {
  const { pageWidth, pageHeight, shapeType } = options;
  const w = shapeType === "circle" ? 220 : 300;
  const h = shapeType === "circle" ? 220 : 200;
  return {
    type: "SHAPE" as const,
    x: Math.max(16, Math.round((pageWidth - w) / 2)),
    y: Math.max(16, Math.round((pageHeight - h) / 2)),
    w,
    h,
    style: defaultShapeNodeStyleV1,
    content: {
      kind: "shape_node_v1",
      shapeType
    }
  };
}
