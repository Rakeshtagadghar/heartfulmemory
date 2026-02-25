"use client";

import { Button } from "../../ui/button";

export function ElementsPanel({
  onAddText,
  onAddImage,
  onOpenPhotos
}: {
  onAddText: () => void;
  onAddImage: () => void;
  onOpenPhotos: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" className="w-full" onClick={onAddText}>
          Text
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={onAddImage}>
          Image
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Starter Elements</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"
            onClick={onAddImage}
          >
            <p className="text-sm font-semibold text-white/90">Image Frame</p>
            <p className="mt-1 text-xs text-white/55">Add a new image placeholder to the active page.</p>
          </button>
          <button
            type="button"
            className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"
            onClick={onOpenPhotos}
          >
            <p className="text-sm font-semibold text-white/90">Browse Photos</p>
            <p className="mt-1 text-xs text-white/55">Open stock photos to insert ready-to-use images.</p>
          </button>
        </div>
      </div>
    </div>
  );
}

