import { describe, it, expect } from "vitest";
import { extractPlainText } from "../../../../packages/shared/richtext/extractPlainText";
import type { TiptapDoc } from "../../../../packages/shared/richtext/tiptapTypes";

describe("extractPlainText", () => {
  it("extracts text from a simple paragraph", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello world" }] }
      ]
    };
    expect(extractPlainText(doc)).toBe("Hello world");
  });

  it("extracts text from multiple paragraphs separated by newlines", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "First" }] },
        { type: "paragraph", content: [{ type: "text", text: "Second" }] }
      ]
    };
    expect(extractPlainText(doc)).toBe("First\nSecond");
  });

  it("extracts text from bold/italic marks", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello ", marks: [{ type: "bold" }] },
            { type: "text", text: "world", marks: [{ type: "italic" }] }
          ]
        }
      ]
    };
    expect(extractPlainText(doc)).toBe("Hello world");
  });

  it("extracts text from list items", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 1" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 2" }] }] }
          ]
        }
      ]
    };
    const result = extractPlainText(doc);
    expect(result).toContain("Item 1");
    expect(result).toContain("Item 2");
  });

  it("returns empty string for empty doc", () => {
    const doc: TiptapDoc = { type: "doc", content: [] };
    expect(extractPlainText(doc)).toBe("");
  });

  it("handles hardBreak as newline", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Line 1" },
            { type: "hardBreak" },
            { type: "text", text: "Line 2" }
          ]
        }
      ]
    };
    expect(extractPlainText(doc)).toBe("Line 1\nLine 2");
  });
});
