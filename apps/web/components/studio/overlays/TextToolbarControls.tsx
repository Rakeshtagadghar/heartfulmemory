"use client";

import type { ReactNode } from "react";
import type { TextAlign, TextFontFamily } from "../../../../../packages/editor/nodes/textNode";

const lineHeights = [1, 1.1, 1.2, 1.4, 1.6];
const letterSpacings = [0, 0.5, 1, 1.5, 2];
export type TextToolbarStyleState = {
  fontFamily: TextFontFamily;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  color: string;
};

function ToolbarIconButton({
  active = false,
  label,
  title,
  onClick,
  children
}: {
  active?: boolean;
  label: string;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border text-slate-700 shadow-sm transition ${
        active
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-slate-300 bg-white hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function AlignIcon({ align }: { align: TextAlign }) {
  const common = {
    className: "h-[15px] w-[15px]",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const
  };
  if (align === "center") {
    return (
      <svg {...common}>
        <path d="M6 7h12M4 12h16M6 17h12" />
      </svg>
    );
  }
  if (align === "right") {
    return (
      <svg {...common}>
        <path d="M8 7h10M4 12h14M10 17h8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 7h10M6 12h14M6 17h8" />
    </svg>
  );
}

export function TextToolbarControls({
  style,
  onPatchStyle,
  onOpenFontPanel,
  onOpenColorPanel
}: {
  style: TextToolbarStyleState;
  onPatchStyle: (patch: Record<string, unknown>) => void;
  onOpenFontPanel?: () => void;
  onOpenColorPanel?: () => void;
}) {
  return (
    <div className="flex flex-nowrap items-center gap-1.5 whitespace-nowrap text-[#0f172a]">
      <button
        type="button"
        aria-label="Open font sidebar"
        title="Open font sidebar"
        onClick={() => onOpenFontPanel?.()}
        className="flex h-8 min-w-[126px] cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
      >
        <span>{style.fontFamily}</span>
        <svg
          className="h-3.5 w-3.5 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className="h-5 w-px bg-slate-300" />

      <div className="flex items-center rounded-xl border border-slate-300 bg-white shadow-sm">
        <button
          type="button"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-l-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
          onClick={() => onPatchStyle({ fontSize: Math.max(8, style.fontSize - 1) })}
          aria-label="Decrease font size"
        >
          -
        </button>
        <input
          type="number"
          min={8}
          max={240}
          value={style.fontSize}
          onChange={(event) => onPatchStyle({ fontSize: Number(event.target.value) })}
          className="h-8 w-12 border-x border-slate-200 bg-white px-1.5 text-center text-sm font-semibold text-slate-800 outline-none"
          aria-label="Font size"
        />
        <button
          type="button"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-r-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
          onClick={() => onPatchStyle({ fontSize: Math.min(240, style.fontSize + 1) })}
          aria-label="Increase font size"
        >
          +
        </button>
      </div>

      <div className="h-5 w-px bg-slate-300" />

      <ToolbarIconButton
        active={style.fontWeight >= 700}
        label="Bold"
        onClick={() => onPatchStyle({ fontWeight: style.fontWeight >= 700 ? 400 : 700 })}
      >
        B
      </ToolbarIconButton>
      <ToolbarIconButton
        active={style.fontStyle === "italic"}
        label="Italic"
        onClick={() => onPatchStyle({ fontStyle: style.fontStyle === "italic" ? "normal" : "italic" })}
      >
        I
      </ToolbarIconButton>
      <ToolbarIconButton
        active={style.textDecoration === "underline"}
        label="Underline"
        onClick={() =>
          onPatchStyle({ textDecoration: style.textDecoration === "underline" ? "none" : "underline" })
        }
      >
        U
      </ToolbarIconButton>

      <div className="h-5 w-px bg-slate-300" />

      {(["left", "center", "right"] as const).map((align) => (
        <ToolbarIconButton
          key={align}
          active={style.textAlign === align}
          label={`Align ${align}`}
          onClick={() => onPatchStyle({ textAlign: align })}
        >
          <AlignIcon align={align} />
        </ToolbarIconButton>
      ))}

      <div className="h-5 w-px bg-slate-300" />

      <select
        aria-label="Line height"
        value={style.lineHeight}
        onChange={(event) => onPatchStyle({ lineHeight: Number(event.target.value) })}
        className="h-8 rounded-xl border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 shadow-sm"
      >
        {lineHeights.map((value) => (
          <option key={value} value={value}>
            LH {value}
          </option>
        ))}
      </select>
      <select
        aria-label="Letter spacing"
        value={style.letterSpacing}
        onChange={(event) => onPatchStyle({ letterSpacing: Number(event.target.value) })}
        className="h-8 rounded-xl border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 shadow-sm"
      >
        {letterSpacings.map((value) => (
          <option key={value} value={value}>
            LS {value}
          </option>
        ))}
      </select>

      <div className="h-5 w-px bg-slate-300" />
      <button
        type="button"
        aria-label="Open color sidebar"
        title="Open color sidebar"
        onClick={() => onOpenColorPanel?.()}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
      >
        <span
          className="h-4 w-4 rounded-full border border-slate-300 shadow-sm"
          style={{ backgroundColor: style.color }}
          aria-hidden
        />
      </button>
    </div>
  );
}
