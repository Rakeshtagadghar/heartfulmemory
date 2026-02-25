import { buildCenteredTextFrameInput, getTextInsertPreset } from "../../../../packages/editor/commands/insertText";
import { buildUpdatedTextStyle } from "../../../../packages/editor/commands/updateTextStyle";
import { migrateTextFrameToTextNodeV1 } from "../../../../packages/editor/serialize/migrations/textNodeV1";

describe("text commands", () => {
  it("builds centered text frame input for heading preset", () => {
    const preset = getTextInsertPreset("heading");
    const migrated = migrateTextFrameToTextNodeV1({ content: { text: preset.text }, style: preset.style as Record<string, unknown> });
    const input = buildCenteredTextFrameInput({
      pageWidth: 800,
      pageHeight: 1100,
      preset,
      style: migrated.style
    });

    expect(input.type).toBe("TEXT");
    expect(input.content.text).toBe("Heading");
    expect(input.style.fontSize).toBe(48);
    expect(input.style.fontWeight).toBe(700);
    expect(input.x).toBeGreaterThanOrEqual(16);
    expect(input.y).toBeGreaterThanOrEqual(16);
  });

  it("merges text style patch and keeps backward-compatible align alias", () => {
    const next = buildUpdatedTextStyle(
      { fontSize: 16, color: "#111111", align: "left" },
      { textAlign: "center", fontWeight: 700, textDecoration: "underline" }
    );

    expect(next.textAlign).toBe("center");
    expect(next.align).toBe("center");
    expect(next.fontWeight).toBe(700);
    expect(next.textDecoration).toBe("underline");
    expect(next.color).toBe("#111111");
  });
});

