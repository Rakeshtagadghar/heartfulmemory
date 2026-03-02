"use client";

import type { TiptapDoc } from "../../shared/richtext/tiptapTypes";
import { tiptapDocToHtml } from "../../shared/richtext/tiptapToHtml";
import { isValidTiptapDoc } from "../../shared/richtext/normalize";

type Props = {
  /** Tiptap JSON document. Falls back to plainText if not present or invalid. */
  contentRich: unknown;
  /** Legacy plain text fallback. */
  plainText?: string | null;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Renders Tiptap JSON as read-only HTML.
 * No live editor is mounted — pure DOM rendering for performance.
 * Use this for all Studio text nodes that are not actively being edited.
 */
export function ReadOnlyRichText({ contentRich, plainText, className, style }: Props) {
  let html: string;
  if (isValidTiptapDoc(contentRich)) {
    html = tiptapDocToHtml(contentRich as TiptapDoc);
  } else if (plainText) {
    // Legacy plain text: convert newlines to <br> and escape
    html = plainText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  } else {
    html = "";
  }

  return (
    <div
      className={className}
      style={style}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by tiptapDocToHtml escaping
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
