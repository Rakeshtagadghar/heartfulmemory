export type GridGroupContentV1 = {
  kind: "grid_group_v1";
  layoutHint: "grid";
  columns: number;
  rows: number;
  gap: number;
  padding: number;
  childrenIds?: string[];
  cells?: Array<{
    id: string;
    row: number;
    col: number;
    rowSpan?: number;
    colSpan?: number;
  }>;
};

export type GroupNodeStyleV1 = {
  stroke: string;
  strokeWidth: number;
  cellFill: string;
  opacity: number;
};

export const defaultGroupNodeStyleV1: GroupNodeStyleV1 = {
  stroke: "#38bdf8",
  strokeWidth: 1,
  cellFill: "rgba(56, 189, 248, 0.08)",
  opacity: 1
};

export function normalizeGridGroupContentV1(
  content: Record<string, unknown> | null | undefined
): GridGroupContentV1 {
  const columns =
    typeof content?.columns === "number" && Number.isFinite(content.columns)
      ? Math.max(1, Math.min(6, Math.round(content.columns)))
      : 2;
  const rows =
    typeof content?.rows === "number" && Number.isFinite(content.rows)
      ? Math.max(1, Math.min(6, Math.round(content.rows)))
      : 2;
  return {
    kind: "grid_group_v1",
    layoutHint: "grid",
    columns,
    rows,
    gap:
      typeof content?.gap === "number" && Number.isFinite(content.gap)
        ? Math.max(0, Math.min(64, content.gap))
        : 16,
    padding:
      typeof content?.padding === "number" && Number.isFinite(content.padding)
        ? Math.max(0, Math.min(64, content.padding))
        : 16,
    childrenIds:
      Array.isArray(content?.childrenIds) &&
      content.childrenIds.every((value) => typeof value === "string" && value.length > 0)
        ? (content.childrenIds as string[])
        : undefined,
    cells:
      Array.isArray(content?.cells)
        ? content.cells
            .filter((cell) => cell && typeof cell === "object")
            .map((cell, index) => {
              const input = cell as Record<string, unknown>;
              return {
                id: typeof input.id === "string" ? input.id : `cell_${index + 1}`,
                row: typeof input.row === "number" ? Math.max(0, Math.round(input.row)) : 0,
                col: typeof input.col === "number" ? Math.max(0, Math.round(input.col)) : 0,
                rowSpan:
                  typeof input.rowSpan === "number" ? Math.max(1, Math.round(input.rowSpan)) : undefined,
                colSpan:
                  typeof input.colSpan === "number" ? Math.max(1, Math.round(input.colSpan)) : undefined
              };
            })
        : undefined
  };
}

export function normalizeGroupNodeStyleV1(style: Record<string, unknown> | null | undefined): GroupNodeStyleV1 {
  const input = style ?? {};
  return {
    stroke: typeof input.stroke === "string" && input.stroke.trim() ? input.stroke : defaultGroupNodeStyleV1.stroke,
    strokeWidth:
      typeof input.strokeWidth === "number" && Number.isFinite(input.strokeWidth)
        ? Math.max(0, Math.min(8, input.strokeWidth))
        : defaultGroupNodeStyleV1.strokeWidth,
    cellFill:
      typeof input.cellFill === "string" && input.cellFill.trim()
        ? input.cellFill
        : defaultGroupNodeStyleV1.cellFill,
    opacity:
      typeof input.opacity === "number" && Number.isFinite(input.opacity)
        ? Math.max(0, Math.min(1, input.opacity))
        : defaultGroupNodeStyleV1.opacity
  };
}
