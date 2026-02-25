"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { estimateTextOverflow } from "../../lib/editor2/textMetrics";
import type { FrameDTO } from "../../lib/dto/frame";
import { CropMode } from "./CropMode";
import { FrameHandles } from "./FrameHandles";
import type { ResizeHandle } from "./FrameHandles";

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
  onDragStart,
  onResizeStart
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
  onDragStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onResizeStart: (handle: ResizeHandle, event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const textStyle = frame.style as Record<string, unknown>;
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
          fontSize: typeof textStyle.fontSize === "number" ? textStyle.fontSize : 15,
          lineHeight: typeof textStyle.lineHeight === "number" ? textStyle.lineHeight : 1.45
        }).overflow
      : false;

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
              onStartTextEdit?.();
            }}
          />
        ) : null}

        {isTextFrame ? (
          <div
            className="relative h-full overflow-hidden p-3 text-[#1f2633]"
            style={{
              fontFamily: textStyle.fontFamily === "serif" ? "Georgia, serif" : "ui-sans-serif, system-ui",
              fontSize: typeof textStyle.fontSize === "number" ? textStyle.fontSize : 15,
              lineHeight: typeof textStyle.lineHeight === "number" ? textStyle.lineHeight : 1.45,
              fontWeight: typeof textStyle.fontWeight === "number" ? textStyle.fontWeight : 400,
              textAlign:
                textStyle.align === "center" || textStyle.align === "right" ? (textStyle.align as "center" | "right") : "left",
              color: typeof textStyle.color === "string" ? textStyle.color : "#1f2633"
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
              <div className="h-full whitespace-pre-wrap break-words">{previewText}</div>
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
