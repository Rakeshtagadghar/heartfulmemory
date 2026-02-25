export type ShapeKind = "rect" | "circle";

export type ShapeNodeStyleV1 = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius?: number;
  opacity: number;
};

export type ShapeNodeContentV1 = {
  kind: "shape_node_v1";
  shapeType: ShapeKind;
};

export const defaultShapeNodeStyleV1: ShapeNodeStyleV1 = {
  fill: "#38bdf8",
  stroke: "#0f172a",
  strokeWidth: 1,
  radius: 16,
  opacity: 1
};

export function normalizeShapeNodeStyleV1(style: Record<string, unknown> | null | undefined): ShapeNodeStyleV1 {
  const input = style ?? {};
  return {
    fill: typeof input.fill === "string" && input.fill.trim() ? input.fill : defaultShapeNodeStyleV1.fill,
    stroke: typeof input.stroke === "string" && input.stroke.trim() ? input.stroke : defaultShapeNodeStyleV1.stroke,
    strokeWidth:
      typeof input.strokeWidth === "number" && Number.isFinite(input.strokeWidth)
        ? Math.max(0, Math.min(32, input.strokeWidth))
        : defaultShapeNodeStyleV1.strokeWidth,
    radius:
      typeof input.radius === "number" && Number.isFinite(input.radius)
        ? Math.max(0, Math.min(999, input.radius))
        : defaultShapeNodeStyleV1.radius,
    opacity:
      typeof input.opacity === "number" && Number.isFinite(input.opacity)
        ? Math.max(0, Math.min(1, input.opacity))
        : defaultShapeNodeStyleV1.opacity
  };
}

export function normalizeShapeNodeContentV1(
  content: Record<string, unknown> | null | undefined
): ShapeNodeContentV1 {
  const shapeType = content?.shapeType === "circle" ? "circle" : "rect";
  return { kind: "shape_node_v1", shapeType };
}
