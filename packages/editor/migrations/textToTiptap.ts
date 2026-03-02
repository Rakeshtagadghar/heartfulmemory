/**
 * Migration: convert legacy plain-text content to Tiptap JSON.
 * Used on load in the Studio text node editor overlay.
 * Idempotent: calling it on an already-migrated doc returns it unchanged.
 */

import type { TiptapDoc } from "../../shared/richtext/tiptapTypes";
import { isValidTiptapDoc, plainTextToTiptapDoc } from "../../shared/richtext/normalize";

type TextNodeContent = Record<string, unknown> | null | undefined;

/**
 * Returns a TiptapDoc for the given text node content.
 *
 * Priority:
 *   1. `content.contentRich` if it is already a valid TiptapDoc
 *   2. `content.text` (legacy plain string) converted to a single-paragraph TiptapDoc
 *   3. Empty doc
 */
export function migrateTextNodeContent(content: TextNodeContent): TiptapDoc {
  if (!content) return { type: "doc", content: [{ type: "paragraph" }] };

  if (isValidTiptapDoc(content.contentRich)) {
    return content.contentRich as TiptapDoc;
  }

  const legacyText = typeof content.text === "string" ? content.text : null;
  if (legacyText) return plainTextToTiptapDoc(legacyText);

  return { type: "doc", content: [{ type: "paragraph" }] };
}

/**
 * Merges a TiptapDoc back into text node content, setting `contentRich` + `plainText`.
 * Preserves all other fields (style, etc.).
 */
export function applyRichContentToNode(
  content: TextNodeContent,
  doc: TiptapDoc,
  plainText: string
): Record<string, unknown> {
  return {
    ...(content ?? {}),
    contentRich: doc,
    plainText
  };
}
