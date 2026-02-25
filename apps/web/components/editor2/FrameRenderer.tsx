"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { estimateTextOverflow } from "../../lib/editor2/textMetrics";
import type { FrameDTO } from "../../lib/dto/frame";
import { CropMode } from "./CropMode";
import { FrameHandles } from "./FrameHandles";
import type { ResizeHandle } from "./FrameHandles";
import { getSanitizedPastedText, shouldEnterTextEditMode } from "../../../../packages/editor/interaction/textEditController";
import { normalizeTextNodeStyleV1 } from "../../../../packages/editor/nodes/textNode";
import { TextRenderer } from "../../../../packages/editor/renderers/TextRenderer";

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

export function FrameRenderer({
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
  onOpenTextContextMenu,
  onDragStart,
  onResizeStart,
  issueMessages
}: {
  frame: FrameDTO;
  selected: boolean;
  textEditing?: boolean;
  cropEditing?: boolean;
  onSelect: () => void;
  onStartTextEdit?: () => void;
  onEndTextEdit?: () => void;
  onTextChange?: (value: string) => void;
  onStartCropEdit?: () => void;
  onEndCropEdit?: () => void;
  onCropChange?: (crop: { focalX: number; focalY: number; scale: number }) => void;
  onOpenTextContextMenu?: (clientX: number, clientY: number) => void;
  onDragStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onResizeStart: (handle: ResizeHandle, event: React.PointerEvent<HTMLButtonElement>) => void;
  issueMessages?: string[];
}) {
  const textStyle = frame.style as Record<string, unknown>;
  const normalizedTextStyle = normalizeTextNodeStyleV1(textStyle);
  const previewText = getTextValue(frame);
  const imageSrc = getImageSource(frame);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isTextFrame = frame.type === "TEXT";

  useEffect(() => {
    if (!textEditing || !textareaRef.current) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
  }, [textEditing]);

  const overflow =
    isTextFrame
          ? estimateTextOverflow({
              text: previewText,
              widthPx: frame.w,
              heightPx: frame.h,
              fontSize: normalizedTextStyle.fontSize,
              lineHeight: normalizedTextStyle.lineHeight
            }).overflow
      : false;
  const hasIssueHighlight = Boolean(issueMessages && issueMessages.length > 0);

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
      <div
        className={`group relative h-full w-full overflow-hidden rounded-lg border ${
          hasIssueHighlight
            ? "border-rose-300 ring-2 ring-rose-300/40"
            :
          textEditing
            ? "border-violet-300 ring-2 ring-violet-300/55"
            : selected
              ? "border-cyan-300 ring-2 ring-cyan-300/40"
              : "border-white/20"
        } ${frame.type === "IMAGE" ? "bg-[#f5f1e8]" : "bg-white/[0.02]"}`}
      >
        {!frame.locked && !isTextFrame && !cropEditing ? (
          <button
            type="button"
            aria-label={`Select and move ${frame.type.toLowerCase()} frame`}
            className="absolute inset-0 cursor-move"
            onPointerDown={(event) => {
              onSelect();
              onDragStart(event);
            }}
          />
        ) : frame.locked ? (
          <button
            type="button"
            aria-label={`Select ${frame.type.toLowerCase()} frame`}
            className="absolute inset-0 cursor-pointer"
            onClick={onSelect}
          />
        ) : null}

        {!frame.locked && isTextFrame && !textEditing ? (
          <button
            type="button"
            aria-label={selected ? "Edit text frame" : "Select and edit text frame"}
            className="absolute inset-0 z-10 cursor-text rounded-lg bg-transparent text-left"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
              if (shouldEnterTextEditMode({ detail: event.detail })) {
                onStartTextEdit?.();
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelect();
              onOpenTextContextMenu?.(event.clientX, event.clientY);
            }}
          />
        ) : null}

        {isTextFrame ? (
          <div
            className="relative h-full overflow-hidden p-3 text-[#1f2633]"
            style={{
              fontFamily:
                normalizedTextStyle.fontFamily === "Inter"
                  ? "Inter, ui-sans-serif, system-ui"
                  : normalizedTextStyle.fontFamily === "Georgia"
                    ? "Georgia, serif"
                    : normalizedTextStyle.fontFamily === "Times New Roman"
                      ? "'Times New Roman', serif"
                      : "Arial, sans-serif",
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
            {textEditing ? (
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
            ) : previewText ? (
              <TextRenderer text={previewText} style={normalizedTextStyle} />
            ) : (
              <span className="text-black/35">Empty text frame</span>
            )}
            {overflow && !textEditing ? (
              <div className="absolute inset-x-2 bottom-2 rounded border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-200">
                Text overflow
              </div>
            ) : null}
          </div>
        ) : (
          imageSrc ? (
            <div
              className="relative h-full w-full bg-black/[0.02]"
              onDoubleClick={(event) => {
                event.stopPropagation();
                onSelect();
                onStartCropEdit?.();
              }}
            >
              {cropEditing ? (
                <CropMode
                  src={imageSrc}
                  frameWidth={frame.w}
                  frameHeight={frame.h}
                  crop={frame.crop}
                  caption={typeof frame.content?.caption === "string" ? frame.content.caption : null}
                  onCropChange={(next) => onCropChange?.(next)}
                  onDone={() => onEndCropEdit?.()}
                />
              ) : (
                <img
                  src={imageSrc}
                  alt={typeof frame.content?.caption === "string" ? frame.content.caption : "Story image"}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  style={{
                    objectPosition: `${Math.round(
                      (typeof frame.crop?.focalX === "number" ? frame.crop.focalX : 0.5) * 100
                    )}% ${Math.round(
                      (typeof frame.crop?.focalY === "number" ? frame.crop.focalY : 0.5) * 100
                    )}%`,
                    transform: `scale(${typeof frame.crop?.scale === "number" ? frame.crop.scale : 1})`,
                    transformOrigin: "center"
                  }}
                />
              )}
              {typeof frame.content?.caption === "string" && frame.content.caption ? (
                <div className="absolute inset-x-2 bottom-2 rounded bg-black/45 px-2 py-1 text-xs text-white/90">
                  {frame.content.caption}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="relative flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f6efe0_0%,#e8dcc1_100%)] p-3">
              <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,#1f2633_1px,transparent_1px),linear-gradient(to_bottom,#1f2633_1px,transparent_1px)] [background-size:14px_14px]" />
              <div className="relative text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a4f36]">
                  Image Frame
                </p>
                <p className="mt-2 text-sm text-[#4b4333]">
                  {typeof frame.content?.placeholderLabel === "string" ? frame.content.placeholderLabel : "Placeholder"}
                </p>
                {typeof frame.content?.caption === "string" && frame.content.caption ? (
                  <p className="mt-2 text-xs text-[#5f5748]">{frame.content.caption}</p>
                ) : null}
              </div>
            </div>
          )
        )}

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
        {hasIssueHighlight ? (
          <div className="absolute bottom-2 left-2 right-2 z-20 rounded-md border border-rose-300/20 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-100">
            {issueMessages?.[0]}
            {issueMessages && issueMessages.length > 1 ? ` (+${issueMessages.length - 1} more)` : ""}
          </div>
        ) : null}
        {frame.type === "IMAGE" && selected && !frame.locked && !cropEditing ? (
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
