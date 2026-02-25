"use client";

import { useState } from "react";
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
  onMovePage,
  onDuplicatePage,
  onDeletePage
}: {
  pages: PageDTO[];
  selectedPageId: string | null;
  framesByPageId: Record<string, FrameDTO[]>;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => Promise<void>;
  onMovePage: (pageId: string, direction: -1 | 1) => Promise<void>;
  onDuplicatePage: (pageId: string) => Promise<void>;
  onDeletePage: (pageId: string) => Promise<void>;
}) {
  const [openMenuPageId, setOpenMenuPageId] = useState<string | null>(null);
  const [confirmDeletePageId, setConfirmDeletePageId] = useState<string | null>(null);

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
          const menuOpen = openMenuPageId === page.id;
          const confirmDelete = confirmDeletePageId === page.id;

          return (
            <div
              key={page.id}
              className={`relative rounded-xl border p-2 ${
                selected ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <button
                type="button"
                className="block w-full cursor-pointer text-left"
                onClick={() => {
                  setOpenMenuPageId(null);
                  setConfirmDeletePageId(null);
                  onSelectPage(page.id);
                }}
              >
                <div className="relative mx-auto h-40 w-[120px] overflow-hidden rounded-md border border-black/10 bg-[#fbfaf6] shadow-[0_8px_16px_rgba(0,0,0,0.25)]">
                  <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] [background-size:10px_10px]" />
                  {frames.map((frame) => (
                    <div
                      key={frame.id}
                      className={`absolute rounded-sm border ${
                        frame.type === "TEXT"
                          ? "border-cyan-700/30 bg-cyan-500/20"
                          : "border-amber-700/30 bg-amber-400/25"
                      }`}
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

              <div className="absolute right-2 top-2 z-20">
                <button
                  type="button"
                  aria-label={`Page ${index + 1} actions`}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-[#0b1422]/85 text-white/90 backdrop-blur hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectPage(page.id);
                    setConfirmDeletePageId((current) => (current === page.id ? current : null));
                    setOpenMenuPageId((current) => (current === page.id ? null : page.id));
                  }}
                >
                  ...
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-10 w-56 rounded-xl border border-white/10 bg-[#0b1320] p-1 shadow-2xl">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={index === 0}
                      onClick={async () => {
                        await onMovePage(page.id, -1);
                        setOpenMenuPageId(null);
                        setConfirmDeletePageId(null);
                      }}
                    >
                      <span>Move Up</span>
                      <span className="text-white/40">Up</span>
                    </button>

                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={index === pages.length - 1}
                      onClick={async () => {
                        await onMovePage(page.id, 1);
                        setOpenMenuPageId(null);
                        setConfirmDeletePageId(null);
                      }}
                    >
                      <span>Move Down</span>
                      <span className="text-white/40">Down</span>
                    </button>

                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.05]"
                      onClick={async () => {
                        await onDuplicatePage(page.id);
                        setOpenMenuPageId(null);
                        setConfirmDeletePageId(null);
                      }}
                    >
                      <span>Duplicate Page</span>
                      <span className="text-white/40">Copy</span>
                    </button>

                    <div className="my-1 h-px bg-white/10" />

                    {confirmDelete ? (
                      <div className="rounded-lg border border-rose-300/20 bg-rose-500/10 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-200/90">
                          Confirm Delete
                        </p>
                        <p className="mt-2 text-sm text-rose-100">
                          Delete <span className="font-semibold">Page {index + 1}</span>?
                        </p>
                        <p className="mt-1 text-xs leading-5 text-rose-100/85">
                          This will remove {frames.length} frame{frames.length === 1 ? "" : "s"} on this page.
                        </p>
                        <div className="mt-3 grid gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="w-full justify-center bg-rose-500 text-white hover:bg-rose-400"
                            onClick={async () => {
                              await onDeletePage(page.id);
                              setConfirmDeletePageId((current) => (current === page.id ? null : current));
                              setOpenMenuPageId((current) => (current === page.id ? null : current));
                            }}
                          >
                            Yes, delete page
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="w-full justify-center"
                            onClick={() => setConfirmDeletePageId(null)}
                          >
                            Keep page
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/10"
                        onClick={() => setConfirmDeletePageId(page.id)}
                      >
                        <span>Delete Page</span>
                        <span className="text-rose-200/70">Delete</span>
                      </button>
                    )}
                  </div>
                ) : null}
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
