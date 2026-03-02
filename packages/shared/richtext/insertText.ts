import type { TiptapDoc, TiptapNode } from "./tiptapTypes";
import { plainTextToTiptapDoc } from "./normalize";

/**
 * Appends plain text as a new paragraph at the end of a Tiptap doc.
 */
export function appendPlainTextToDoc(doc: TiptapDoc, text: string): TiptapDoc {
  if (!text.trim()) return doc;
  const newParagraphs = plainTextToTiptapDoc(text).content ?? [];
  return {
    type: "doc",
    content: [...(doc.content ?? []), ...newParagraphs]
  };
}

/**
 * Replaces the entire document content with plain text.
 */
export function replacePlainTextInDoc(_doc: TiptapDoc, text: string): TiptapDoc {
  return plainTextToTiptapDoc(text);
}

/**
 * Counts approximate word count for a doc (for quota/progress use).
 */
export function countWords(doc: TiptapDoc): number {
  const text = flattenText(doc.content ?? []);
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function flattenText(nodes: TiptapNode[]): string {
  return nodes.map((node) => {
    if (node.type === "text") return node.text ?? "";
    return flattenText(node.content ?? []) + (node.type === "paragraph" ? " " : "");
  }).join("");
}
