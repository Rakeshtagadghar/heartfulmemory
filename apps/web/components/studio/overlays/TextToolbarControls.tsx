"use client";

import { useRef, useState, useEffect } from "react";
import type { TextAlign, TextFontFamily } from "../../../../../packages/editor/nodes/textNode";

const lineHeights = [1, 1.1, 1.2, 1.4, 1.6];
const letterSpacings = [0, 0.5, 1, 1.5, 2];
const FONT_FAMILIES: TextFontFamily[] = ["Inter", "Arial", "Georgia", "Times New Roman"];

export type TextToolbarStyleState = {
  fontFamily: TextFontFamily;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  color: string;
};

const BTN =
  "inline-flex items-center justify-center w-8 h-8 cursor-pointer rounded text-sm font-medium text-gray-600 " +
  "hover:bg-gray-100 hover:text-gray-900 transition-colors " +
  "data-[active]:bg-gray-100 data-[active]:text-gray-900";

const SEP = "h-5 w-px bg-gray-200 mx-0.5 shrink-0";

const CHEVRON = (
  <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current opacity-50 shrink-0" aria-hidden="true">
    <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
  </svg>
);

function AlignIcon({ align }: { align: TextAlign }) {
  if (align === "center") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
        <rect x="1" y="3" width="14" height="1.5" rx="0.5" /><rect x="3.5" y="6.5" width="9" height="1.5" rx="0.5" />
        <rect x="1" y="10" width="14" height="1.5" rx="0.5" /><rect x="3.5" y="13.5" width="9" height="1.5" rx="0.5" />
      </svg>
    );
  }
  if (align === "right") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
        <rect x="1" y="3" width="14" height="1.5" rx="0.5" /><rect x="6" y="6.5" width="9" height="1.5" rx="0.5" />
        <rect x="1" y="10" width="14" height="1.5" rx="0.5" /><rect x="6" y="13.5" width="9" height="1.5" rx="0.5" />
      </svg>
    );
  }
  if (align === "justify") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
        <rect x="1" y="3" width="14" height="1.5" rx="0.5" /><rect x="1" y="6.5" width="14" height="1.5" rx="0.5" />
        <rect x="1" y="10" width="14" height="1.5" rx="0.5" /><rect x="1" y="13.5" width="14" height="1.5" rx="0.5" />
      </svg>
    );
  }
  // left
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <rect x="1" y="3" width="14" height="1.5" rx="0.5" /><rect x="1" y="6.5" width="9" height="1.5" rx="0.5" />
      <rect x="1" y="10" width="14" height="1.5" rx="0.5" /><rect x="1" y="13.5" width="9" height="1.5" rx="0.5" />
    </svg>
  );
}

/** Compact dropdown for font family, matching BubbleMenu block-type style */
function FontFamilyDropdown({ value, onChange }: { value: TextFontFamily; onChange: (v: TextFontFamily) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((s) => !s); }}
        className="flex h-8 cursor-pointer items-center gap-1 rounded px-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
      >
        <span className="max-w-[80px] truncate">{value}</span>
        {CHEVRON}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {FONT_FAMILIES.map((f) => (
            <button key={f} type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(f); setOpen(false); }}
              className={[
                "w-full cursor-pointer px-3 py-1.5 text-left text-xs hover:bg-gray-50",
                value === f ? "font-semibold text-gray-900" : "text-gray-700"
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Spacing dropdown — combines line-height and letter-spacing */
function SpacingDropdown({
  lineHeight, letterSpacing, onPatchStyle
}: { lineHeight: number; letterSpacing: number; onPatchStyle: (p: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((s) => !s); }}
        className="flex h-8 cursor-pointer items-center gap-1 rounded px-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>Spacing</span>
        {CHEVRON}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
          <p className="px-3 pb-1 pt-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Line height</p>
          <div className="flex flex-wrap gap-1 px-3 pb-2">
            {lineHeights.map((v) => (
              <button key={v} type="button"
                onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ lineHeight: v }); }}
                className={[
                  "rounded px-2 py-1 text-xs cursor-pointer transition-colors",
                  lineHeight === v ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                ].join(" ")}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="mx-3 border-t border-gray-100" />
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Letter spacing</p>
          <div className="flex flex-wrap gap-1 px-3 pb-1">
            {letterSpacings.map((v) => (
              <button key={v} type="button"
                onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ letterSpacing: v }); }}
                className={[
                  "rounded px-2 py-1 text-xs cursor-pointer transition-colors",
                  letterSpacing === v ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                ].join(" ")}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TextToolbarControls({
  style,
  onPatchStyle
}: {
  style: TextToolbarStyleState;
  onPatchStyle: (patch: Record<string, unknown>) => void;
  onOpenFontPanel?: () => void;
}) {
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const isBold = style.fontWeight >= 700;
  const isItalic = style.fontStyle === "italic";
  const isUnderline = style.textDecoration === "underline";
  const isStrike = style.textDecoration === "line-through";

  function handleColorClick(e: React.MouseEvent) {
    e.preventDefault();
    colorInputRef.current?.click();
  }

  return (
    <div className="flex items-center gap-0.5 whitespace-nowrap">

      {/* Font family */}
      <FontFamilyDropdown
        value={style.fontFamily}
        onChange={(f) => onPatchStyle({ fontFamily: f })}
      />

      <div className={SEP} />

      {/* Font size */}
      <button type="button" title="Decrease font size" className={BTN}
        onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ fontSize: Math.max(8, style.fontSize - 1) }); }}>
        <span className="text-base leading-none font-semibold">−</span>
      </button>
      <input
        type="number" min={8} max={240}
        value={style.fontSize}
        onChange={(e) => onPatchStyle({ fontSize: Number(e.target.value) })}
        className="h-8 w-9 bg-transparent text-center text-xs font-semibold text-gray-800 outline-none"
        aria-label="Font size"
      />
      <button type="button" title="Increase font size" className={BTN}
        onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ fontSize: Math.min(240, style.fontSize + 1) }); }}>
        <span className="text-base leading-none font-semibold">+</span>
      </button>

      <div className={SEP} />

      {/* Inline marks */}
      <button type="button" title="Bold" data-active={isBold || undefined} className={BTN}
        onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ fontWeight: isBold ? 400 : 700 }); }}>
        <strong>B</strong>
      </button>
      <button type="button" title="Italic" data-active={isItalic || undefined} className={BTN}
        onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ fontStyle: isItalic ? "normal" : "italic" }); }}>
        <em>I</em>
      </button>
      <button type="button" title="Underline" data-active={isUnderline || undefined} className={BTN}
        onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ textDecoration: isUnderline ? "none" : "underline" }); }}>
        <span className="underline">U</span>
      </button>
      <button type="button" title="Strikethrough" data-active={isStrike || undefined} className={BTN}
        onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ textDecoration: isStrike ? "none" : "line-through" }); }}>
        <span className="line-through">S</span>
      </button>

      <div className={SEP} />

      {/* Alignment */}
      {(["left", "center", "right", "justify"] as const).map((align) => (
        <button key={align} type="button" title={`Align ${align}`}
          data-active={style.textAlign === align || undefined} className={BTN}
          onMouseDown={(e) => { e.preventDefault(); onPatchStyle({ textAlign: align }); }}>
          <AlignIcon align={align} />
        </button>
      ))}

      <div className={SEP} />

      {/* Spacing (LH + LS combined) */}
      <SpacingDropdown
        lineHeight={style.lineHeight}
        letterSpacing={style.letterSpacing}
        onPatchStyle={onPatchStyle}
      />

      <div className={SEP} />

      {/* Color */}
      <div className="relative">
        <button type="button" title="Text color"
          onMouseDown={handleColorClick}
          className={BTN} style={{ flexDirection: "column", gap: 1 }}>
          <span className="text-sm font-bold leading-none">A</span>
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: style.color }} />
        </button>
        <input ref={colorInputRef} type="color" className="sr-only"
          value={style.color}
          onChange={(e) => onPatchStyle({ color: e.target.value })} />
      </div>

    </div>
  );
}
