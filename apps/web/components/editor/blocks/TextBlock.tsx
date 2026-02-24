"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { SaveStatus } from "../SaveStatus";
import { ConflictBanner } from "../ConflictBanner";
import { useAutosave } from "../../../lib/editor/autosave";
import { normalizeTextBlockContent } from "../../../lib/editor/serialize";
import type { BlockDTO } from "../../../lib/dto/block";

function withSelectionWrap(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix = prefix
) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const nextText = `${value.slice(0, selectionStart)}${prefix}${selected}${suffix}${value.slice(selectionEnd)}`;
  const nextCaretStart = selectionStart + prefix.length;
  const nextCaretEnd = nextCaretStart + selected.length;

  return {
    nextText,
    nextCaretStart,
    nextCaretEnd
  };
}

function withSelectionReplace(textarea: HTMLTextAreaElement, replacement: string) {
  const { selectionStart, selectionEnd, value } = textarea;
  const nextText = `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`;
  const nextCaret = selectionStart + replacement.length;

  return {
    nextText,
    nextCaretStart: nextCaret,
    nextCaretEnd: nextCaret
  };
}

export function TextBlock({
  block,
  storybookId,
  draftHtml,
  onDraftChange,
  onSaved,
  onUpdateBlock,
  onReloadFromServer
}: {
  block: BlockDTO;
  storybookId: string;
  draftHtml?: string;
  onDraftChange: (blockId: string, html: string) => void;
  onSaved: (block: BlockDTO) => void;
  onReloadFromServer: () => Promise<void>;
  onUpdateBlock: (input: {
    storybookId: string;
    blockId: string;
    content: Record<string, unknown>;
    expectedVersion?: number;
    overwrite?: boolean;
  }) => Promise<{ ok: true; data: BlockDTO } | { ok: false; error: string; code?: string }>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const content = useMemo(() => normalizeTextBlockContent(block.content), [block.content]);
  const [version, setVersion] = useState(block.version);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [overwriteNonce, setOverwriteNonce] = useState(0);
  const html = draftHtml ?? content.html;
  const isDirty = html !== content.html;

  function updateTextareaValue(nextText: string, selection?: { start: number; end: number }) {
    onDraftChange(block.id, nextText);
    if (selection) {
      queueMicrotask(() => {
        if (!textareaRef.current) return;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(selection.start, selection.end);
      });
    }
  }

  function applyInlineFormat(format: "bold" | "italic" | "h2" | "list" | "quote") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (format === "bold") {
      const next = withSelectionWrap(textarea, "<strong>", "</strong>");
      updateTextareaValue(next.nextText, { start: next.nextCaretStart, end: next.nextCaretEnd });
      return;
    }

    if (format === "italic") {
      const next = withSelectionWrap(textarea, "<em>", "</em>");
      updateTextareaValue(next.nextText, { start: next.nextCaretStart, end: next.nextCaretEnd });
      return;
    }

    if (format === "h2") {
      const next = withSelectionWrap(textarea, "<h2>", "</h2>");
      updateTextareaValue(next.nextText, { start: next.nextCaretStart, end: next.nextCaretEnd });
      return;
    }

    if (format === "quote") {
      const next = withSelectionWrap(textarea, "<blockquote>", "</blockquote>");
      updateTextareaValue(next.nextText, { start: next.nextCaretStart, end: next.nextCaretEnd });
      return;
    }

    const next = withSelectionReplace(textarea, "<ul>\n  <li></li>\n</ul>");
    updateTextareaValue(next.nextText, { start: next.nextCaretStart - 12, end: next.nextCaretStart - 12 });
  }

  const autosave = useAutosave({
    payload: {
      html,
      version,
      overwriteNonce
    },
    isDirty,
    debounceMs: 1000,
    save: async ({ html: nextHtml, version: expectedVersion, overwriteNonce: nonce }) =>
      onUpdateBlock({
        storybookId,
        blockId: block.id,
        expectedVersion,
        overwrite: nonce > 0,
        content: {
          ...content,
          html: nextHtml
        }
      }),
    onSaved: (savedBlock) => {
      setVersion(savedBlock.version);
      setConflictMessage(null);
      onSaved(savedBlock);
    },
    onConflict: (message) => setConflictMessage(message)
  });

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => applyInlineFormat("bold")}>
            Bold
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => applyInlineFormat("italic")}>
            Italic
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => applyInlineFormat("h2")}>
            H2
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => applyInlineFormat("list")}>
            List
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => applyInlineFormat("quote")}>
            Quote
          </Button>
        </div>
        <SaveStatus status={autosave.status} error={autosave.error} />
      </div>

      {conflictMessage ? (
        <div className="mt-3">
          <ConflictBanner
            message={conflictMessage}
            onReload={() => {
              void onReloadFromServer();
              setConflictMessage(null);
            }}
            onOverwrite={() => {
              setConflictMessage(null);
              setOverwriteNonce((value) => value + 1);
              autosave.retryNow();
            }}
          />
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <label htmlFor={`text-block-${block.id}`} className="sr-only">
          Rich text chapter content
        </label>
        <textarea
          ref={textareaRef}
          id={`text-block-${block.id}`}
          value={html}
          onChange={(event) => {
            onDraftChange(block.id, event.target.value);
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
              event.preventDefault();
              applyInlineFormat("bold");
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
              event.preventDefault();
              applyInlineFormat("italic");
            }
          }}
          placeholder="Start typing a memory, a scene, a quote, or a story prompt..."
          className="min-h-36 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:border-gold/50"
        />
        {html.length === 0 ? (
          <p className="mt-2 text-xs text-white/35">
            Use toolbar buttons to insert HTML snippets (e.g. headings, list, quote).
          </p>
        ) : null}
      </div>
    </Card>
  );
}

