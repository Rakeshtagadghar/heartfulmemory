import { normalizeGridGroupContentV1, normalizeGroupNodeStyleV1 } from "../nodes/groupNode";

export function GroupRenderer({
  style,
  content
}: {
  style: Record<string, unknown>;
  content: Record<string, unknown>;
}) {
  const nodeStyle = normalizeGroupNodeStyleV1(style);
  const nodeContent = normalizeGridGroupContentV1(content);
  const cols = nodeContent.columns;
  const rows = nodeContent.rows;
  const cells = nodeContent.cells;
  const visibleCells =
    cells && cells.length > 0
      ? cells
      : Array.from({ length: cols * rows }, (_, index) => ({
          id: `grid-cell-${index + 1}`,
          row: Math.floor(index / cols),
          col: index % cols,
          rowSpan: 1,
          colSpan: 1
        }));

  return (
    <div
      className="relative h-full w-full"
      style={{
        opacity: nodeStyle.opacity,
        padding: nodeContent.padding
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gap: nodeContent.gap,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
        }}
      >
        {visibleCells.map((cell) => (
          <div
            key={cell.id}
            className="rounded-lg"
            style={{
              border: `${nodeStyle.strokeWidth}px dashed ${nodeStyle.stroke}`,
              background: nodeStyle.cellFill,
              gridColumn: `${cell.col + 1} / span ${cell.colSpan ?? 1}`,
              gridRow: `${cell.row + 1} / span ${cell.rowSpan ?? 1}`
            }}
          />
        ))}
      </div>
    </div>
  );
}
