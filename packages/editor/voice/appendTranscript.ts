import type { TiptapDoc } from "../../shared/richtext/tiptapTypes";
import { appendPlainTextToDoc } from "../../shared/richtext/insertText";
import { extractPlainText } from "../../shared/richtext/extractPlainText";

export type AppendMode = "paragraph" | "space";

/**
 * Appends transcript text to an existing Tiptap doc.
 *
 * - "paragraph" (default): appends as new paragraph node(s)
 * - "space": appends inline with a space separator
 *
 * If the doc is empty, the transcript becomes the entire content regardless of mode.
 * Returns the original doc if the transcript is empty.
 */
export function appendTranscriptToDoc(
  doc: TiptapDoc,
  transcript: string,
  mode: AppendMode = "paragraph"
): TiptapDoc {
  const trimmed = transcript.trim();
  if (!trimmed) return doc;

  const existingText = extractPlainText(doc);

  if (!existingText.trim()) {
    return appendPlainTextToDoc({ type: "doc", content: [] }, trimmed);
  }

  if (mode === "paragraph") {
    return appendPlainTextToDoc(doc, trimmed);
  }

  // Space mode: add space separator if last char isn't already whitespace
  const needsSeparator = existingText.length > 0 && !/\s$/.test(existingText);
  const separator = needsSeparator ? " " : "";
  return appendPlainTextToDoc(doc, separator + trimmed);
}

/**
 * Returns whether a TiptapDoc has non-empty text content.
 */
export function isDocNonEmpty(doc: TiptapDoc | null): boolean {
  if (!doc) return false;
  return extractPlainText(doc).trim().length > 0;
}
