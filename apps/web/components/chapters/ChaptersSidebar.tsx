"use client";

import { useState, useTransition } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import type { ChapterDTO } from "../../lib/dto/chapter";
import { trackChapterSelected } from "../../lib/analytics/events_creation";

export function ChaptersSidebar({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onReorderChapters
}: {
  chapters: ChapterDTO[];
  selectedChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => Promise<void>;
  onRenameChapter: (chapterId: string, title: string) => Promise<void>;
  onDeleteChapter: (chapterId: string) => Promise<void>;
  onReorderChapters: (orderedChapterIds: string[]) => Promise<void>;
}) {
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function moveChapter(chapterId: string, direction: -1 | 1) {
    const currentIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= chapters.length) return;
    const next = [...chapters];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    startTransition(() => {
      void onReorderChapters(next.map((chapter) => chapter.id));
    });
  }

  return (
    <Card className="h-full p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Chapters</p>
          <p className="text-sm text-white/70">{chapters.length} total</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            startTransition(() => {
              void onAddChapter();
            });
          }}
          loading={isPending}
        >
          Add
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {chapters.map((chapter, index) => {
          const isSelected = chapter.id === selectedChapterId;
          const isEditing = pendingRenameId === chapter.id;

          return (
            <div
              key={chapter.id}
              className={`rounded-xl border p-3 ${isSelected ? "border-gold/45 bg-gold/10" : "border-white/10 bg-white/[0.02]"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer flex-col text-left"
                  onClick={() => {
                    trackChapterSelected({ chapter_id: chapter.id, order_index: chapter.order_index });
                    onSelectChapter(chapter.id);
                  }}
                >
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    Chapter {index + 1}
                  </span>
                  <span className="truncate text-sm font-semibold text-parchment">{chapter.title}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${chapter.title} up`}
                    className="h-7 min-w-9 cursor-pointer rounded-md border border-white/10 px-2 text-xs text-white/70 hover:bg-white/[0.05]"
                    onClick={() => moveChapter(chapter.id, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${chapter.title} down`}
                    className="h-7 min-w-9 cursor-pointer rounded-md border border-white/10 px-2 text-xs text-white/70 hover:bg-white/[0.05]"
                    onClick={() => moveChapter(chapter.id, 1)}
                  >
                    Down
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const nextTitle = renameDraft.trim();
                    if (!nextTitle) return;
                    startTransition(async () => {
                      await onRenameChapter(chapter.id, nextTitle);
                      setPendingRenameId(null);
                    });
                  }}
                >
                  <label htmlFor={`rename-${chapter.id}`} className="sr-only">
                    Rename chapter
                  </label>
                  <input
                    id={`rename-${chapter.id}`}
                    value={renameDraft}
                    onChange={(event) => setRenameDraft(event.target.value)}
                    className="h-9 w-full rounded-lg border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/50"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" loading={isPending}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setPendingRenameId(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setPendingRenameId(chapter.id);
                      setRenameDraft(chapter.title);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      startTransition(() => {
                        void onDeleteChapter(chapter.id);
                      });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
