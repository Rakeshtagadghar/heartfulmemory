export type LineNodeStyleV1 = {
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  opacity: number;
};

export type LineNodeContentV1 = {
  kind: "line_node_v1";
};

export const defaultLineNodeStyleV1: LineNodeStyleV1 = {
  stroke: "#0f172a",
  strokeWidth: 2,
  dash: undefined,
  opacity: 1
};

export function normalizeLineNodeStyleV1(style: Record<string, unknown> | null | undefined): LineNodeStyleV1 {
  const input = style ?? {};
  return {
    stroke: typeof input.stroke === "string" && input.stroke.trim() ? input.stroke : defaultLineNodeStyleV1.stroke,
    strokeWidth:
      typeof input.strokeWidth === "number" && Number.isFinite(input.strokeWidth)
        ? Math.max(1, Math.min(32, input.strokeWidth))
        : defaultLineNodeStyleV1.strokeWidth,
    dash:
      Array.isArray(input.dash) && input.dash.every((n) => typeof n === "number" && Number.isFinite(n))
        ? (input.dash as number[])
        : undefined,
    opacity:
      typeof input.opacity === "number" && Number.isFinite(input.opacity)
        ? Math.max(0, Math.min(1, input.opacity))
        : defaultLineNodeStyleV1.opacity
  };
}
