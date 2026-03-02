import { describe, it, expect } from "vitest";
import { tiptapDocToPdfHtml } from "../../../../packages/pdf/richtext/tiptapToHtml";
import { sanitizeRichtextHtml } from "../../../../packages/pdf/richtext/htmlSanitize";
import type { TiptapDoc } from "../../../../packages/shared/richtext/tiptapTypes";

describe("tiptapDocToPdfHtml", () => {
  it("returns empty string for invalid input", () => {
    expect(tiptapDocToPdfHtml(null)).toBe("");
    expect(tiptapDocToPdfHtml({ type: "notDoc" })).toBe("");
    expect(tiptapDocToPdfHtml("string")).toBe("");
  });

  it("renders a simple paragraph", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello PDF" }] }]
    };
    const html = tiptapDocToPdfHtml(doc);
    expect(html).toContain("<p>");
    expect(html).toContain("Hello PDF");
  });

  it("renders bold and italic marks", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "bold", marks: [{ type: "bold" }] },
            { type: "text", text: " italic", marks: [{ type: "italic" }] }
          ]
        }
      ]
    };
    const html = tiptapDocToPdfHtml(doc);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em> italic</em>");
  });

  it("renders bullet and ordered lists", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item A" }] }] }
          ]
        },
        {
          type: "orderedList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 1" }] }] }
          ]
        }
      ]
    };
    const html = tiptapDocToPdfHtml(doc);
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("Item A");
    expect(html).toContain("Item 1");
  });

  it("escapes XSS in text content", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "<script>alert(1)</script>" }] }
      ]
    };
    const html = tiptapDocToPdfHtml(doc);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("sanitizeRichtextHtml", () => {
  it("strips script tags", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeRichtextHtml(html)).not.toContain("<script>");
  });

  it("strips unknown tags", () => {
    const html = "<custom-element>text</custom-element>";
    const result = sanitizeRichtextHtml(html);
    expect(result).not.toContain("custom-element");
    expect(result).toContain("text");
  });

  it("allows safe href links", () => {
    const html = '<a href="https://example.com">link</a>';
    expect(sanitizeRichtextHtml(html)).toContain('href="https://example.com"');
  });

  it("strips javascript: href links", () => {
    const html = '<a href="javascript:alert(1)">evil</a>';
    expect(sanitizeRichtextHtml(html)).not.toContain("javascript:");
  });
});
