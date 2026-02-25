import { buildCenteredTextFrameInput, getTextInsertPreset } from "../../../../packages/editor/commands/insertText";
import { buildUpdatedTextStyle } from "../../../../packages/editor/commands/updateTextStyle";
import { normalizeTextNodeStyleV1 } from "../../../../packages/editor/nodes/textNode";
import { migrateTextFrameToTextNodeV1 } from "../../../../packages/editor/serialize/migrations/textNodeV1";

describe("text system persistence pipeline", () => {
  it("insert preset -> style update -> normalize rehydrates the same values", () => {
    const preset = getTextInsertPreset("subheading");
    const migrated = migrateTextFrameToTextNodeV1({
      content: { text: "Subheading" },
      style: preset.style as Record<string, unknown>
    });
    const inserted = buildCenteredTextFrameInput({
      pageWidth: 900,
      pageHeight: 1200,
      preset,
      style: migrated.style
    });

    const nextStyle = buildUpdatedTextStyle(inserted.style, {
      fontFamily: "Georgia",
      fontSize: 32,
      textAlign: "center",
      color: "#2563eb",
      letterSpacing: 1
    });

    const rehydrated = normalizeTextNodeStyleV1(nextStyle);
    expect(rehydrated.fontFamily).toBe("Georgia");
    expect(rehydrated.fontSize).toBe(32);
    expect(rehydrated.textAlign).toBe("center");
    expect(rehydrated.color).toBe("#2563eb");
    expect(rehydrated.letterSpacing).toBe(1);
  });
});
