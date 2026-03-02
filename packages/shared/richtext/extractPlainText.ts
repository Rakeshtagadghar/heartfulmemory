import type { TiptapDoc, TiptapNode } from "./tiptapTypes";

function collectText(node: TiptapNode, parts: string[]): void {
  if (node.type === "text" && typeof node.text === "string") {
    parts.push(node.text);
    return;
  }
  if (node.type === "hardBreak") {
    parts.push("\n");
    return;
  }
  if (node.content) {
    for (const child of node.content) {
      collectText(child, parts);
    }
    // Block-level nodes add a newline after their content
    const blockTypes = new Set([
      "paragraph",
      "heading",
      "blockquote",
      "codeBlock",
      "listItem",
      "bulletList",
      "orderedList",
      "taskList",
      "taskItem"
    ]);
    if (blockTypes.has(node.type)) {
      parts.push("\n");
    }
  }
}

/**
 * Extracts plain text from a Tiptap JSON document.
 * Preserves paragraph breaks as newlines.
 */
export function extractPlainText(doc: TiptapDoc): string {
  const parts: string[] = [];
  for (const node of doc.content ?? []) {
    collectText(node, parts);
  }
  return parts.join("").trim();
}
