"use client";

import { useEffect, useRef } from "react";
import { estimateTextOverflow } from "../../lib/editor2/textMetrics";
import type { FrameDTO } from "../../lib/dto/frame";
import { CropMode } from "./CropMode";
import { FrameHandles } from "./FrameHandles";
import type { ResizeHandle } from "./FrameHandles";
import { getSanitizedPastedText, shouldEnterTextEditMode } from "../../../../packages/editor/interaction/textEditController";
import { normalizeTextNodeStyleV1 } from "../../../../packages/editor/nodes/textNode";
import { TextRenderer } from "../../../../packages/editor/renderers/TextRenderer";
import { ShapeRenderer } from "../../../../packages/editor/renderers/ShapeRenderer";
import { LineRenderer } from "../../../../packages/editor/renderers/LineRenderer";
import { ElementFrameRenderer } from "../../../../packages/editor/renderers/FrameRenderer";
import { GroupRenderer } from "../../../../packages/editor/renderers/GroupRenderer";
import { ImageRenderer } from "../../../../packages/editor/renderers/ImageRenderer";
import { normalizeFrameNodeContentV1 } from "../../../../packages/editor/nodes/frameNode";

function getTextValue(frame: FrameDTO) {
  const text = frame.content?.text;
  return typeof text === "string" ? text : "";
}

function getImageSource(frame: FrameDTO) {
  if (typeof frame.content?.sourceUrl === "string" && frame.content.sourceUrl) {
    return frame.content.sourceUrl;
  }
  if (typeof frame.content?.previewUrl === "string" && frame.content.previewUrl) {
    return frame.content.previewUrl;
  }
  return null;
}

function isImagePlaceholderFrame(frame: FrameDTO) {
  return frame.type === "IMAGE" || frame.type === "FRAME";
}

function getFrameImageSource(frame: FrameDTO) {
  if (frame.type === "IMAGE") {
    return getImageSource(frame);
  }
  if (frame.type === "FRAME") {
    const content = normalizeFrameNodeContentV1(frame.content);
    return content.imageRef?.sourceUrl || content.imageRef?.previewUrl || null;
  }
  return null;
}

function getTextFontFamilyCss(fontFamily: string) {
  if (fontFamily === "Inter") return "Inter, ui-sans-serif, system-ui";
  if (fontFamily === "Georgia") return "Georgia, serif";
  if (fontFamily === "Times New Roman") return "'Times New Roman', serif";
  return "Arial, sans-serif";
}

function getFrameShellClasses(input: {
  hasIssueHighlight: boolean;
  textEditing: boolean;
  selected: boolean;
  type: FrameDTO["type"];
}) {
  let stateClass = "border-white/20";
  if (input.hasIssueHighlight) {
    stateClass = "border-rose-300 ring-2 ring-rose-300/40";
  } else if (input.textEditing) {
    stateClass = "border-violet-300 ring-2 ring-violet-300/55";
  } else if (input.selected) {
    stateClass = "border-cyan-300 ring-2 ring-cyan-300/40";
  }

  let bgClass = "bg-white/[0.02]";
  if (input.type === "IMAGE" || input.type === "FRAME") {
    bgClass = "bg-[#f5f1e8]";
  } else if (input.type === "LINE") {
    bgClass = "bg-transparent";
  }

  return `group relative h-full w-full overflow-hidden rounded-lg border ${stateClass} ${bgClass}`;
}

export function FrameRenderer({ // NOSONAR
  frame,
  selected,
  textEditing,
  cropEditing,
  onSelect,
  onStartTextEdit,
  onEndTextEdit,
  onTextChange,
  onStartCropEdit,
  onEndCropEdit,
  onCropChange,
  cropOverride,
  onOpenTextContextMenu,
  onOpenElementContextMenu,
  onDragStart,
  onResizeStart,
  issueMessages
}: {
  frame: FrameDTO;
  selected: boolean;
  textEditing?: boolean;
  cropEditing?: boolean;
  onSelect: (options?: { additive?: boolean; preserveIfSelected?: boolean }) => void;
  onStartTextEdit?: () => void;
  onEndTextEdit?: () => void;
  onTextChange?: (value: string) => void;
  onStartCropEdit?: () => void;
  onEndCropEdit?: () => void;
  onCropChange?: (crop: Record<string, unknown>) => void;
  cropOverride?: Record<string, unknown> | null;
  onOpenTextContextMenu?: (clientX: number, clientY: number) => void;
  onOpenElementContextMenu?: (clientX: number, clientY: number) => void;
  onDragStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onResizeStart: (handle: ResizeHandle, event: React.PointerEvent<HTMLButtonElement>) => void;
  issueMessages?: string[];
}) {
  const textStyle = frame.style;
  const normalizedTextStyle = normalizeTextNodeStyleV1(textStyle);
  const previewText = getTextValue(frame);
  const imageSrc = getImageSource(frame);
  const frameFillImageSrc = frame.type === "FRAME" ? getFrameImageSource(frame) : null;
  const renderCrop = cropOverride ?? frame.crop;
  const cropEditableImageSrc = getFrameImageSource(frame);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isTextFrame = frame.type === "TEXT";

  useEffect(() => {
    if (!textEditing || !textareaRef.current) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
  }, [textEditing]);

  let overflow = false;
  if (isTextFrame) {
    overflow = estimateTextOverflow({
      text: previewText,
      widthPx: frame.w,
      heightPx: frame.h,
      fontSize: normalizedTextStyle.fontSize,
      lineHeight: normalizedTextStyle.lineHeight
    }).overflow;
  }
  const hasIssueHighlight = Boolean(issueMessages && issueMessages.length > 0);
  const shellClasses = getFrameShellClasses({
    hasIssueHighlight,
    textEditing: Boolean(textEditing),
    selected,
    type: frame.type
  });

  function renderTextFrameContent() {
    if (textEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={previewText}
          onChange={(event) => onTextChange?.(event.target.value)}
          onBlur={() => onEndTextEdit?.()}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onEndTextEdit?.();
            }
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onEndTextEdit?.();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = getSanitizedPastedText(event.nativeEvent);
            const target = event.currentTarget;
            const start = target.selectionStart ?? target.value.length;
            const end = target.selectionEnd ?? target.value.length;
            const next = `${target.value.slice(0, start)}${pasted}${target.value.slice(end)}`;
            onTextChange?.(next);
            globalThis.requestAnimationFrame(() => {
              const caret = start + pasted.length;
              target.setSelectionRange(caret, caret);
            });
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="h-full w-full resize-none border-0 bg-transparent p-0 text-inherit outline-none"
          style={{
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "inherit",
            fontWeight: "inherit",
            textAlign: "inherit",
            color: "inherit"
          }}
        />
      );
    }
    if (previewText) {
      return <TextRenderer text={previewText} style={normalizedTextStyle} />;
    }
    return <span className="text-black/35">Empty text frame</span>;
  }

  function renderNonTextOverlay() {
    if (!frame.locked && !isTextFrame && !cropEditing) {
      return (
        <button
          type="button"
          aria-label={`Select and move ${frame.type.toLowerCase()} frame`}
          className="absolute inset-0 z-10 cursor-move"
          onPointerDown={(event) => {
            const additive = event.shiftKey || event.metaKey || event.ctrlKey;
            onSelect(additive ? { additive: true } : { preserveIfSelected: true });
            if (additive) return;
            onDragStart(event);
          }}
          onDoubleClick={(event) => {
            if (!cropEditableImageSrc) return;
            event.preventDefault();
            event.stopPropagation();
            onSelect({ preserveIfSelected: true });
            onStartCropEdit?.();
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect({ preserveIfSelected: true });
            onOpenElementContextMenu?.(event.clientX, event.clientY);
          }}
        />
      );
    }

    if (!frame.locked) {
      return null;
    }

    return (
      <button
        type="button"
        aria-label={`Select ${frame.type.toLowerCase()} frame`}
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={(event) => onSelect({ additive: event.shiftKey || event.metaKey || event.ctrlKey })}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect({ preserveIfSelected: true });
          if (frame.type !== "TEXT") {
            onOpenElementContextMenu?.(event.clientX, event.clientY);
          }
        }}
      />
    );
  }

  function renderFrameBody() { // NOSONAR
    if (isTextFrame) {
      return (
        <div
          className="relative h-full overflow-hidden p-3 text-[#1f2633]"
          style={{
            fontFamily: getTextFontFamilyCss(normalizedTextStyle.fontFamily),
            fontSize: normalizedTextStyle.fontSize,
            lineHeight: normalizedTextStyle.lineHeight,
            fontWeight: normalizedTextStyle.fontWeight,
            fontStyle: normalizedTextStyle.fontStyle,
            textDecoration: normalizedTextStyle.textDecoration,
            letterSpacing: `${normalizedTextStyle.letterSpacing}px`,
            textAlign: normalizedTextStyle.textAlign,
            color: normalizedTextStyle.color,
            opacity: normalizedTextStyle.opacity
          }}
        >
          {renderTextFrameContent()}
          {overflow && !textEditing ? (
            <div className="absolute inset-x-2 bottom-2 rounded border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-200">
              Text overflow
            </div>
          ) : null}
        </div>
      );
    }

    if (frame.type === "SHAPE") {
      return <ShapeRenderer style={frame.style} content={frame.content} />;
    }
    if (frame.type === "LINE") {
      return <LineRenderer style={frame.style} />;
    }
    if (frame.type === "GROUP") {
      return <GroupRenderer style={frame.style} content={frame.content} />;
    }
    if (frame.type === "FRAME") {
      if (cropEditing && frameFillImageSrc) {
        return (
          <div className="relative h-full w-full bg-black/[0.02]">
            <CropMode
              src={frameFillImageSrc}
              frameWidth={frame.w}
              frameHeight={frame.h}
              crop={renderCrop ?? null}
              caption={typeof frame.content?.caption === "string" ? frame.content.caption : null}
              onCropChange={(next) => onCropChange?.(next)}
              onDone={() => onEndCropEdit?.()}
              showHeader={false}
            />
          </div>
        );
      }
      return (
        <div className="relative h-full w-full">
          <ElementFrameRenderer style={frame.style} content={frame.content} crop={renderCrop ?? null} />
        </div>
      );
    }

    if (imageSrc) {
      return (
        <div className="relative h-full w-full bg-black/[0.02]">
          {cropEditing ? (
            <CropMode
              src={imageSrc}
              frameWidth={frame.w}
              frameHeight={frame.h}
              crop={renderCrop ?? null}
              caption={typeof frame.content?.caption === "string" ? frame.content.caption : null}
              onCropChange={(next) => onCropChange?.(next)}
              onDone={() => onEndCropEdit?.()}
              showHeader={false}
            />
          ) : (
            <ImageRenderer
              src={imageSrc}
              alt={typeof frame.content?.caption === "string" ? frame.content.caption : "Story image"}
              crop={renderCrop ?? null}
            />
          )}
          {typeof frame.content?.caption === "string" && frame.content.caption ? (
            <div className="absolute inset-x-2 bottom-2 rounded bg-black/45 px-2 py-1 text-xs text-white/90">
              {frame.content.caption}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="relative flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f6efe0_0%,#e8dcc1_100%)] p-3">
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,#1f2633_1px,transparent_1px),linear-gradient(to_bottom,#1f2633_1px,transparent_1px)] [background-size:14px_14px]" />
        <div className="relative text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a4f36]">Image Frame</p>
          <p className="mt-2 text-sm text-[#4b4333]">
            {typeof frame.content?.placeholderLabel === "string" ? frame.content.placeholderLabel : "Placeholder"}
          </p>
          {typeof frame.content?.caption === "string" && frame.content.caption ? (
            <p className="mt-2 text-xs text-[#5f5748]">{frame.content.caption}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute ${selected ? "z-20" : "z-10"}`}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.w,
        height: frame.h
      }}
    >
      <div className={shellClasses}>
        {renderNonTextOverlay()}

        {!frame.locked && isTextFrame && !textEditing ? (
          <button
            type="button"
            aria-label={selected ? "Edit text frame" : "Select and edit text frame"}
            className="absolute inset-0 z-10 cursor-text rounded-lg bg-transparent text-left"
            onClick={(event) => {
              event.stopPropagation();
              onSelect({ additive: event.shiftKey || event.metaKey || event.ctrlKey });
              if (shouldEnterTextEditMode({ detail: event.detail })) {
                onStartTextEdit?.();
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelect({ preserveIfSelected: true });
              onOpenTextContextMenu?.(event.clientX, event.clientY);
            }}
          />
        ) : null}

        {renderFrameBody()}

        {frame.locked ? (
          <span className="absolute right-2 top-2 rounded bg-black/45 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/75">
            Locked
          </span>
        ) : null}
        {frame.type === "TEXT" && selected && !textEditing ? (
          <button
            type="button"
            className="absolute right-2 top-2 z-20 cursor-pointer rounded-lg border border-white/15 bg-black/55 px-2 py-1 text-xs text-white hover:bg-black/70"
            onClick={(event) => {
              event.stopPropagation();
              onOpenTextContextMenu?.(event.clientX, event.clientY);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenTextContextMenu?.(event.clientX, event.clientY);
            }}
            aria-label="Open text box actions"
            title="More"
          >
            ...
          </button>
        ) : null}
        {frame.type !== "TEXT" && selected && !frame.locked ? (
          <button
            type="button"
            className="absolute right-2 top-2 z-20 cursor-pointer rounded-lg border border-white/15 bg-black/55 px-2 py-1 text-xs text-white hover:bg-black/70"
            onClick={(event) => {
              event.stopPropagation();
              onOpenElementContextMenu?.(event.clientX, event.clientY);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenElementContextMenu?.(event.clientX, event.clientY);
            }}
            aria-label="Open element actions"
            title="More"
          >
            ...
          </button>
        ) : null}
        {hasIssueHighlight ? (
          <div className="absolute bottom-2 left-2 right-2 z-20 rounded-md border border-rose-300/20 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-100">
            {issueMessages?.[0]}
            {issueMessages && issueMessages.length > 1 ? ` (+${issueMessages.length - 1} more)` : ""}
          </div>
        ) : null}
        {isImagePlaceholderFrame(frame) && selected && !frame.locked && !cropEditing && cropEditableImageSrc ? (
          <button
            type="button"
            className="absolute left-2 top-2 z-20 cursor-pointer rounded-lg border border-white/15 bg-black/55 px-2 py-1 text-xs text-white hover:bg-black/70"
            onClick={(event) => {
              event.stopPropagation();
              onStartCropEdit?.();
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              onStartCropEdit?.();
            }}
          >
            Crop
          </button>
        ) : null}
      </div>

      <FrameHandles visible={selected && !frame.locked && !cropEditing} onResizeStart={onResizeStart} />
    </div>
  );
}
