import type { TiptapDoc, TiptapNode } from "./tiptapTypes";

export function isValidTiptapDoc(json: unknown): json is TiptapDoc {
  if (!json || typeof json !== "object" || Array.isArray(json)) return false;
  const obj = json as Record<string, unknown>;
  return obj.type === "doc";
}

/**
 * Ensures the value is a valid TiptapDoc, returning a minimal empty doc if not.
 */
export function normalizeTiptapDoc(json: unknown): TiptapDoc {
  if (isValidTiptapDoc(json)) return json;
  return { type: "doc", content: [{ type: "paragraph" }] };
}

/**
 * Converts a plain text string to a minimal Tiptap doc.
 * Each newline-separated block becomes a paragraph.
 */
export function plainTextToTiptapDoc(text: string): TiptapDoc {
  const trimmed = typeof text === "string" ? text : "";
  if (!trimmed) return { type: "doc", content: [{ type: "paragraph" }] };

  const paragraphs: TiptapNode[] = trimmed.split("\n").map((line) => {
    if (!line) return { type: "paragraph" };
    return {
      type: "paragraph",
      content: [{ type: "text", text: line }]
    };
  });

  return { type: "doc", content: paragraphs };
}
