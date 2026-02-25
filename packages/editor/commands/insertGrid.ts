import { defaultGroupNodeStyleV1 } from "../nodes/groupNode";

export type GridPresetId = "grid_2_col" | "grid_3_col" | "grid_2x2";

export function buildCenteredGridGroupInput(options: {
  pageWidth: number;
  pageHeight: number;
  preset: GridPresetId;
}) {
  const { pageWidth, pageHeight, preset } = options;
  const columns = preset === "grid_3_col" ? 3 : 2;
  const rows = preset === "grid_2x2" ? 2 : 1;
  const w = Math.min(pageWidth - 48, Math.round(pageWidth * 0.7));
  const h = rows === 1 ? 180 : Math.min(pageHeight - 48, 320);
  const cells = Array.from({ length: columns * rows }, (_, index) => ({
    id: `cell_${index + 1}`,
    row: Math.floor(index / columns),
    col: index % columns,
    rowSpan: 1,
    colSpan: 1
  }));
  return {
    type: "GROUP" as const,
    x: Math.max(16, Math.round((pageWidth - w) / 2)),
    y: Math.max(16, Math.round((pageHeight - h) / 2)),
    w,
    h,
    style: defaultGroupNodeStyleV1,
    content: {
      kind: "grid_group_v1",
      layoutHint: "grid",
      columns,
      rows,
      gap: 16,
      padding: 16,
      childrenIds: cells.map((cell) => cell.id),
      cells
    }
  };
}
