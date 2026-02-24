"use client";

import { Button } from "../ui/button";
import type { PageDTO } from "../../lib/dto/page";
import type { FrameDTO } from "../../lib/dto/frame";

function frameThumbStyle(frame: FrameDTO, page: PageDTO) {
  const scaleX = 120 / page.width_px;
  const scaleY = 160 / page.height_px;
  return {
    left: frame.x * scaleX,
    top: frame.y * scaleY,
    width: frame.w * scaleX,
    height: frame.h * scaleY
  };
}

export function PagesPanel({
  pages,
  selectedPageId,
  framesByPageId,
  onSelectPage,
  onAddPage,
  onMovePage
}: {
  pages: PageDTO[];
  selectedPageId: string | null;
  framesByPageId: Record<string, FrameDTO[]>;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => Promise<void>;
  onMovePage: (pageId: string, direction: -1 | 1) => Promise<void>;
}) {
  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-white/10 bg-[#0d1626]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Pages</p>
        <div className="mt-3">
          <Button type="button" size="sm" className="w-full justify-center" onClick={() => void onAddPage()}>
            + Add Page
          </Button>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-3">
        {pages.map((page, index) => {
          const selected = page.id === selectedPageId;
          const frames = (framesByPageId[page.id] ?? []).slice().sort((a, b) => a.z_index - b.z_index);
          return (
            <div
              key={page.id}
              className={`rounded-xl border p-2 ${selected ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/10 bg-white/[0.02]"}`}
            >
              <button
                type="button"
                className="block w-full cursor-pointer text-left"
                onClick={() => onSelectPage(page.id)}
              >
                <div className="mx-auto relative h-40 w-[120px] overflow-hidden rounded-md border border-black/10 bg-[#fbfaf6] shadow-[0_8px_16px_rgba(0,0,0,0.25)]">
                  <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] [background-size:10px_10px]" />
                  {frames.map((frame) => (
                    <div
                      key={frame.id}
                      className={`absolute rounded-sm border ${frame.type === "TEXT" ? "border-cyan-700/30 bg-cyan-500/20" : "border-amber-700/30 bg-amber-400/25"}`}
                      style={frameThumbStyle(frame, page)}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white/90">Page {index + 1}</p>
                    <p className="text-[11px] text-white/50">{page.size_preset}</p>
                  </div>
                  <p className="text-[11px] text-white/45">{frames.length} frames</p>
                </div>
              </button>
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => void onMovePage(page.id, -1)}>
                  Up
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => void onMovePage(page.id, 1)}>
                  Down
                </Button>
              </div>
            </div>
          );
        })}
        {pages.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/65">
            No pages yet. Add a page to begin layout editing.
          </p>
        ) : null}
      </div>
    </aside>
  );
}

