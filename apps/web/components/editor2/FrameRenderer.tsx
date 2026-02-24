"use client";

import { estimateTextOverflow } from "../../lib/editor2/textMetrics";
import type { FrameDTO } from "../../lib/dto/frame";
import { FrameHandles } from "./FrameHandles";

function getTextValue(frame: FrameDTO) {
  const text = frame.content?.text;
  return typeof text === "string" ? text : "";
}

export function FrameRenderer({
  frame,
  selected,
  onSelect,
  onDragStart,
  onResizeStart
}: {
  frame: FrameDTO;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onResizeStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const textStyle = frame.style as Record<string, unknown>;
  const previewText = getTextValue(frame);
  const overflow =
    frame.type === "TEXT"
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
        className={`group relative h-full w-full overflow-hidden rounded-lg border ${selected ? "border-cyan-300 ring-2 ring-cyan-300/40" : "border-white/20"} ${
          frame.type === "IMAGE" ? "bg-[#f5f1e8]" : "bg-white/[0.02]"
        }`}
      >
        {!frame.locked ? (
          <button
            type="button"
            aria-label={`Select and move ${frame.type.toLowerCase()} frame`}
            className="absolute inset-0 cursor-move"
            onPointerDown={(event) => {
              onSelect();
              onDragStart(event);
            }}
          />
        ) : (
          <button
            type="button"
            aria-label={`Select ${frame.type.toLowerCase()} frame`}
            className="absolute inset-0 cursor-pointer"
            onClick={onSelect}
          />
        )}

        {frame.type === "TEXT" ? (
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
            {previewText || <span className="text-black/35">Empty text frame</span>}
            {overflow ? (
              <div className="absolute inset-x-2 bottom-2 rounded border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-200">
                Text overflow
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
        )}

        {frame.locked ? (
          <span className="absolute right-2 top-2 rounded bg-black/45 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/75">
            Locked
          </span>
        ) : null}
      </div>

      <FrameHandles visible={selected && !frame.locked} onResizeStart={onResizeStart} />
    </div>
  );
}

