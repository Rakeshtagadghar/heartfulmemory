import { buildCenteredGridGroupInput } from "../../../../packages/editor/commands/insertGrid";

describe("insertGrid command", () => {
  it("builds a centered 2x2 grid group with deterministic cell metadata", () => {
    const input = buildCenteredGridGroupInput({
      pageWidth: 800,
      pageHeight: 1100,
      preset: "grid_2x2"
    });

    expect(input.type).toBe("GROUP");
    expect(input.w).toBeLessThanOrEqual(Math.round(800 * 0.7));
    expect(input.content).toMatchObject({
      kind: "grid_group_v1",
      layoutHint: "grid",
      columns: 2,
      rows: 2,
      gap: 16,
      padding: 16
    });
    const cells = (input.content as { cells?: Array<{ id: string }> }).cells ?? [];
    expect(cells).toHaveLength(4);
    expect(cells.map((cell) => cell.id)).toEqual(["cell_1", "cell_2", "cell_3", "cell_4"]);
    expect((input.content as { childrenIds?: string[] }).childrenIds).toEqual(["cell_1", "cell_2", "cell_3", "cell_4"]);
  });
});

