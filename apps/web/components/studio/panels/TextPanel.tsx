"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../ui/button";
import type { TextPresetId } from "../../../../../packages/editor/commands/insertText";
import type { TextFontFamily } from "../../../../../packages/editor/nodes/textNode";

const fontOptions: Array<{ family: TextFontFamily; preview: string }> = [
  { family: "Inter", preview: "A modern clean sans for everyday reading" },
  { family: "Arial", preview: "Classic sans-serif for high readability" },
  { family: "Georgia", preview: "Elegant serif for editorial storytelling" },
  { family: "Times New Roman", preview: "Traditional serif for formal layouts" }
];

export function TextPanel({
  onAddTextBox,
  onAddPreset,
  selectedFontFamily,
  onSelectFont,
  selectedColor,
  onSelectColor,
  initialView = "presets",
  onViewChange
}: {
  onAddTextBox: () => void;
  onAddPreset: (presetId: Exclude<TextPresetId, "textbox">) => void;
  selectedFontFamily?: TextFontFamily | null;
  onSelectFont?: (fontFamily: TextFontFamily) => void;
  selectedColor?: string | null;
  onSelectColor?: (color: string) => void;
  initialView?: "presets" | "fonts" | "colors";
  onViewChange?: (view: "presets" | "fonts" | "colors") => void;
}) {
  const [view, setView] = useState<"presets" | "fonts" | "colors">(initialView);
  const [query, setQuery] = useState("");
  const [customColor, setCustomColor] = useState(selectedColor ?? "#1f2633");
  const colorSwatches = ["#1f2633", "#ffffff", "#0f172a", "#2563eb", "#be123c", "#0f766e", "#854d0e"];
  useEffect(() => {
    setView(initialView);
  }, [initialView]);
  useEffect(() => {
    if (selectedColor) {
      setCustomColor(selectedColor);
    }
  }, [selectedColor]);
  const filteredFonts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fontOptions;
    return fontOptions.filter((font) => font.family.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`h-10 cursor-pointer rounded-xl border text-sm font-semibold transition ${
              view === "presets"
                ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/[0.04]"
            }`}
            onClick={() => {
              setView("presets");
              onViewChange?.("presets");
            }}
          >
            Text
          </button>
          <button
            type="button"
            className={`h-10 cursor-pointer rounded-xl border text-sm font-semibold transition ${
              view === "fonts"
                ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/[0.04]"
            }`}
            onClick={() => {
              setView("fonts");
              onViewChange?.("fonts");
            }}
          >
            Font
          </button>
          <button
            type="button"
            className={`h-10 cursor-pointer rounded-xl border text-sm font-semibold transition ${
              view === "colors"
                ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/[0.04]"
            }`}
            onClick={() => {
              setView("colors");
              onViewChange?.("colors");
            }}
          >
            Color
          </button>
        </div>
      </div>

      {view === "presets" ? (
        <>
          <Button type="button" className="w-full" onClick={onAddTextBox}>
            Add Text Box
          </Button>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Quick Styles</p>
            <button
              type="button"
              className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"
              onClick={() => onAddPreset("heading")}
            >
              <p className="text-xl font-semibold text-white">Add a heading</p>
            </button>
            <button
              type="button"
              className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"
              onClick={() => onAddPreset("subheading")}
            >
              <p className="text-base font-semibold text-white/90">Add a subheading</p>
            </button>
            <button
              type="button"
              className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"
              onClick={() => onAddPreset("body")}
            >
              <p className="text-sm text-white/75">Add body text for stories, captions, and notes.</p>
            </button>
          </div>
        </>
      ) : view === "fonts" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45" htmlFor="font-search">
              Search Fonts
            </label>
            <input
              id="font-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Try "Georgia" or "Inter"'
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
            />
          </div>

          <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {filteredFonts.map((font) => {
              const active = selectedFontFamily === font.family;
              const previewFamily =
                font.family === "Inter"
                  ? "Inter, ui-sans-serif, system-ui"
                  : font.family === "Georgia"
                    ? "Georgia, serif"
                    : font.family === "Times New Roman"
                      ? "'Times New Roman', serif"
                      : "Arial, sans-serif";
              return (
                <button
                  key={font.family}
                  type="button"
                  className={`block w-full cursor-pointer rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-cyan-300/30 bg-cyan-400/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                  onClick={() => onSelectFont?.(font.family)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{font.family}</p>
                    {active ? (
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-cyan-100">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-white/75" style={{ fontFamily: previewFamily }}>
                    {font.preview}
                  </p>
                </button>
              );
            })}
            {filteredFonts.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/65">
                No fonts match your search.
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-3 text-xs uppercase tracking-[0.14em] text-white/45">Text Color</p>
            <div className="grid grid-cols-4 gap-2">
              {colorSwatches.map((color) => {
                const active = (selectedColor ?? "").toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    className={`h-10 cursor-pointer rounded-xl border transition ${
                      active ? "border-cyan-300/60 ring-2 ring-cyan-400/20" : "border-white/10"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setCustomColor(color);
                      onSelectColor?.(color);
                    }}
                    aria-label={`Select color ${color}`}
                    title={color}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45" htmlFor="text-color-hex">
              Custom Hex
            </label>
            <div className="flex items-center gap-2">
              <input
                id="text-color-hex"
                type="text"
                value={customColor}
                onChange={(event) => setCustomColor(event.target.value)}
                placeholder="#1f2633"
                className="h-10 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
              />
              <button
                type="button"
                className="h-10 cursor-pointer rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/15"
                onClick={() => onSelectColor?.(customColor.trim() || "#1f2633")}
              >
                Apply
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-white/60">Preview</span>
              <span
                className="h-6 w-6 rounded-full border border-white/15"
                style={{ backgroundColor: customColor || "#1f2633" }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
