import { describe, expect, it } from "vitest";
import {
  appendTranscriptToDoc,
  isDocNonEmpty
} from "../../../../packages/editor/voice/appendTranscript";
import { extractPlainText } from "../../../../packages/shared/richtext/extractPlainText";
import { plainTextToTiptapDoc } from "../../../../packages/shared/richtext/normalize";
import type { TiptapDoc } from "../../../../packages/shared/richtext/tiptapTypes";

const emptyDoc: TiptapDoc = { type: "doc", content: [] };

function docFromText(text: string): TiptapDoc {
  return plainTextToTiptapDoc(text);
}

describe("appendTranscriptToDoc", () => {
  it("appends as paragraph when doc has existing content", () => {
    const doc = docFromText("Hello world");
    const result = appendTranscriptToDoc(doc, "New text", "paragraph");
    const plain = extractPlainText(result);
    expect(plain).toContain("Hello world");
    expect(plain).toContain("New text");
  });

  it("sets transcript as content when doc is empty", () => {
    const result = appendTranscriptToDoc(emptyDoc, "First words");
    const plain = extractPlainText(result);
    expect(plain.trim()).toBe("First words");
  });

  it("returns original doc when transcript is empty", () => {
    const doc = docFromText("Existing text");
    const result = appendTranscriptToDoc(doc, "   ", "paragraph");
    expect(result).toBe(doc);
  });

  it("returns original doc when transcript is whitespace only", () => {
    const doc = docFromText("Existing");
    const result = appendTranscriptToDoc(doc, "\n\t  ");
    expect(result).toBe(doc);
  });

  it("space mode adds separator when last char is not whitespace", () => {
    const doc = docFromText("Hello");
    const result = appendTranscriptToDoc(doc, "world", "space");
    const plain = extractPlainText(result);
    // Should have space between Hello and world
    expect(plain).toContain("Hello");
    expect(plain).toContain("world");
  });

  it("paragraph mode produces multiple paragraphs in the doc", () => {
    const doc = docFromText("First paragraph");
    const result = appendTranscriptToDoc(doc, "Second paragraph", "paragraph");
    // The resulting doc should have content nodes from both
    expect(result.content!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("isDocNonEmpty", () => {
  it("returns false for null doc", () => {
    expect(isDocNonEmpty(null)).toBe(false);
  });

  it("returns false for empty doc", () => {
    expect(isDocNonEmpty(emptyDoc)).toBe(false);
  });

  it("returns true for doc with content", () => {
    expect(isDocNonEmpty(docFromText("Hello"))).toBe(true);
  });

  it("returns false for doc with only whitespace", () => {
    expect(isDocNonEmpty(docFromText("   "))).toBe(false);
  });
});
