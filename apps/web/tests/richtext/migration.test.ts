import { describe, it, expect } from "vitest";
import { migrateTextNodeContent, applyRichContentToNode } from "../../../../packages/editor/migrations/textToTiptap";
import { isValidTiptapDoc } from "../../../../packages/shared/richtext/normalize";

describe("migrateTextNodeContent", () => {
  it("returns an empty doc for null content", () => {
    const result = migrateTextNodeContent(null);
    expect(isValidTiptapDoc(result)).toBe(true);
    expect(result.content?.[0]?.type).toBe("paragraph");
  });

  it("preserves existing valid Tiptap doc in contentRich", () => {
    const richDoc = {
      type: "doc" as const,
      content: [{ type: "paragraph", content: [{ type: "text", text: "Rich text" }] }]
    };
    const result = migrateTextNodeContent({ contentRich: richDoc });
    expect(result).toEqual(richDoc);
  });

  it("converts legacy plain text string to a Tiptap doc", () => {
    const result = migrateTextNodeContent({ text: "Legacy content" });
    expect(isValidTiptapDoc(result)).toBe(true);
    // Should contain the legacy text
    const firstNode = result.content?.[0];
    expect(firstNode?.content?.[0]?.text).toBe("Legacy content");
  });

  it("multi-line plain text becomes multiple paragraphs", () => {
    const result = migrateTextNodeContent({ text: "Line 1\nLine 2" });
    expect(result.content?.length).toBe(2);
  });

  it("is idempotent: migrating an already-migrated doc returns the same doc", () => {
    const richDoc = {
      type: "doc" as const,
      content: [{ type: "paragraph", content: [{ type: "text", text: "Already rich" }] }]
    };
    const result1 = migrateTextNodeContent({ contentRich: richDoc });
    const result2 = migrateTextNodeContent({ contentRich: result1 });
    expect(result2).toEqual(result1);
  });
});

describe("applyRichContentToNode", () => {
  it("sets contentRich and plainText, preserves other fields", () => {
    const doc = { type: "doc" as const, content: [] };
    const result = applyRichContentToNode({ text: "old", style: { color: "red" } }, doc, "new text");
    expect(result.contentRich).toEqual(doc);
    expect(result.plainText).toBe("new text");
    expect(result.text).toBe("old");
    expect((result.style as Record<string, string>).color).toBe("red");
  });
});
