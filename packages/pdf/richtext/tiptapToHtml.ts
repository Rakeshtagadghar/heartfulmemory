/**
 * Converts a Tiptap JSON document to a sanitized HTML string for use in PDF rendering.
 * Re-uses the shared serializer, then sanitizes the output.
 */

import { tiptapDocToHtml } from "../../shared/richtext/tiptapToHtml";
import { isValidTiptapDoc } from "../../shared/richtext/normalize";
import { sanitizeRichtextHtml } from "./htmlSanitize";
import type { TiptapDoc } from "../../shared/richtext/tiptapTypes";

/**
 * Converts a Tiptap JSON document to sanitized HTML suitable for PDF output.
 * Returns an empty string if the input is not a valid Tiptap doc.
 */
export function tiptapDocToPdfHtml(doc: unknown): string {
  if (!isValidTiptapDoc(doc)) return "";
  const raw = tiptapDocToHtml(doc as TiptapDoc);
  return sanitizeRichtextHtml(raw);
}
