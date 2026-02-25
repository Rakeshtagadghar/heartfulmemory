"use client";

import { Button } from "../../ui/button";

export function TextPanel({
  onAddText
}: {
  onAddText: () => void;
}) {
  return (
    <div className="space-y-3">
      <Button type="button" className="w-full" onClick={onAddText}>
        Add Text Box
      </Button>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Quick Styles</p>
        <button
          type="button"
          className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"
          onClick={onAddText}
        >
          <p className="text-xl font-semibold text-white">Add a heading</p>
        </button>
        <button
          type="button"
          className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"
          onClick={onAddText}
        >
          <p className="text-base font-semibold text-white/90">Add a subheading</p>
        </button>
        <button
          type="button"
          className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"
          onClick={onAddText}
        >
          <p className="text-sm text-white/75">Add body text for stories, captions, and notes.</p>
        </button>
      </div>
    </div>
  );
}

