"use client";

import { startTransition, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ChaptersSidebar } from "../chapters/ChaptersSidebar";
import { BlockList } from "./BlockList";
import type { BlockDTO } from "../../lib/dto/block";
import type { ChapterDTO } from "../../lib/dto/chapter";
import type { StorybookDTO } from "../../lib/dto/storybook";
import {
  createChapterAction,
  insertImagePlaceholderBlockAction,
  insertTextBlockAction,
  listChaptersAction,
  loadChapterBlocksAction,
  removeBlockAction,
  removeChapterAction,
  renameChapterAction,
  renameStorybookAction,
  reorderChaptersAction,
  updateBlockAction
} from "../../lib/actions/storybook-editor";
import { normalizeTextBlockContent } from "../../lib/editor/serialize";
import {
  trackChapterFirstSave,
  trackStorybookCreated,
  trackStorybookRename
} from "../../lib/analytics/events_creation";

type EditorShellProps = {
  initialStorybook: StorybookDTO;
  initialChapters: ChapterDTO[];
  initialBlocksByChapterId: Record<string, BlockDTO[]>;
  createdEvent?: {
    source?: string;
    template_id?: string;
    template_version?: number;
  } | null;
};

function sortByOrderIndex<T extends { order_index: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order_index - b.order_index);
}

export function EditorShell({
  initialStorybook,
  initialChapters,
  initialBlocksByChapterId,
  createdEvent
}: EditorShellProps) {
  const [storybook, setStorybook] = useState(initialStorybook);
  const [storybookTitleDraft, setStorybookTitleDraft] = useState(initialStorybook.title);
  const [storybookSubtitleDraft, setStorybookSubtitleDraft] = useState(initialStorybook.subtitle ?? "");
  const [chapters, setChapters] = useState(sortByOrderIndex(initialChapters));
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(initialChapters[0]?.id ?? null);
  const [chapterTitleDraftsById, setChapterTitleDraftsById] = useState<Record<string, string>>({});
  const [blocksByChapterId, setBlocksByChapterId] =
    useState<Record<string, BlockDTO[]>>(initialBlocksByChapterId);
  const [draftsByBlockId, setDraftsByBlockId] = useState<Record<string, string>>({});
  const [editorMessage, setEditorMessage] = useState<string | null>(null);
  const [blocksLoadingChapterId, setBlocksLoadingChapterId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSavingStorybook, startStorybookSave] = useTransition();
  const [isSavingChapterTitle, startChapterTitleSave] = useTransition();
  const chapterTitleInputRef = useRef<HTMLInputElement | null>(null);
  const mobileDialogRef = useRef<HTMLDialogElement | null>(null);
  const trackedCreatedRef = useRef(false);
  const firstSavedChaptersRef = useRef(new Set<string>());
  const loadingChapterIdsRef = useRef(new Set<string>());

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === selectedChapterId) ?? null,
    [chapters, selectedChapterId]
  );
  const selectedBlocks = useMemo(
    () => (selectedChapterId ? sortByOrderIndex(blocksByChapterId[selectedChapterId] ?? []) : []),
    [blocksByChapterId, selectedChapterId]
  );
  const chapterTitleDraft = selectedChapter
    ? (chapterTitleDraftsById[selectedChapter.id] ?? selectedChapter.title)
    : "";

  useEffect(() => {
    chapterTitleInputRef.current?.focus();
  }, [selectedChapter?.id]);

  useEffect(() => {
    if (!createdEvent || trackedCreatedRef.current) return;
    trackedCreatedRef.current = true;
    trackStorybookCreated({
      source: createdEvent.source ?? "unknown",
      template_id: createdEvent.template_id ?? null,
      template_version: createdEvent.template_version ?? null
    });
    if (globalThis.window !== undefined) {
      const url = new URL(globalThis.window.location.href);
      ["created", "source", "templateId", "templateVersion"].forEach((key) => url.searchParams.delete(key));
      globalThis.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [createdEvent]);

  async function refreshChapterList() {
    const result = await listChaptersAction(storybook.id);
    if (!result.ok) {
      setEditorMessage(result.error);
      return;
    }

    const ordered = sortByOrderIndex(result.data);
    setChapters(ordered);
    if (!selectedChapterId && ordered[0]) {
      setSelectedChapterId(ordered[0].id);
    }
  }

  async function loadBlocksForChapter(chapterId: string, force = false) {
    if (!force && blocksByChapterId[chapterId]) return;
    if (loadingChapterIdsRef.current.has(chapterId)) return;

    loadingChapterIdsRef.current.add(chapterId);
    setBlocksLoadingChapterId(chapterId);
    const result = await loadChapterBlocksAction(chapterId);
    loadingChapterIdsRef.current.delete(chapterId);
    setBlocksLoadingChapterId((current) => (current === chapterId ? null : current));

    if (!result.ok) {
      setEditorMessage(result.error);
      return;
    }

    const orderedBlocks = sortByOrderIndex(result.data);
    setBlocksByChapterId((current) => ({ ...current, [chapterId]: orderedBlocks }));
    setDraftsByBlockId((current) => {
      const next = { ...current };
      for (const block of orderedBlocks) {
        if (block.type === "TEXT") {
          next[block.id] = normalizeTextBlockContent(block.content).html;
        }
      }
      return next;
    });
  }

  async function handleSelectChapter(chapterId: string) {
    setSelectedChapterId(chapterId);
    setEditorMessage(null);
    if (isMobileSidebarOpen) {
      mobileDialogRef.current?.close();
      setIsMobileSidebarOpen(false);
    }
    await loadBlocksForChapter(chapterId);
  }

  async function handleAddChapter() {
    setEditorMessage(null);
    const result = await createChapterAction(storybook.id);
    if (!result.ok) {
      setEditorMessage(result.error);
      return;
    }
    setChapters((current) => sortByOrderIndex([...current, result.data]));
    setSelectedChapterId(result.data.id);
    setBlocksByChapterId((current) => ({ ...current, [result.data.id]: [] }));
  }

  async function handleRenameChapter(chapterId: string, title: string) {
    setEditorMessage(null);
    const result = await renameChapterAction(storybook.id, chapterId, title);
    if (!result.ok) {
      setEditorMessage(result.error);
      return;
    }
    setChapters((current) =>
      current.map((chapter) => (chapter.id === chapterId ? result.data : chapter))
    );
    setChapterTitleDraftsById((current) => ({ ...current, [chapterId]: result.data.title }));
  }

  async function handleDeleteChapter(chapterId: string) {
    setEditorMessage(null);
    const result = await removeChapterAction(storybook.id, chapterId);
    if (!result.ok) {
      setEditorMessage(result.error);
      return;
    }

    setChapters((current) => {
      const next = current.filter((chapter) => chapter.id !== chapterId);
      if (selectedChapterId === chapterId) {
        setSelectedChapterId(next[0]?.id ?? null);
      }
      return next;
    });
    setBlocksByChapterId((current) => {
      const next = { ...current };
      delete next[chapterId];
      return next;
    });
    startTransition(() => {
      void refreshChapterList();
    });
  }

  async function handleReorderChapters(orderedChapterIds: string[]) {
    const previous = chapters;
    const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
    const optimistic = orderedChapterIds
      .map((id, index) => {
        const chapter = byId.get(id);
        return chapter ? { ...chapter, order_index: index } : null;
      })
      .filter((chapter): chapter is ChapterDTO => chapter !== null);

    setChapters(optimistic);
    const result = await reorderChaptersAction(storybook.id, orderedChapterIds);
    if (!result.ok) {
      setChapters(previous);
      setEditorMessage(result.error);
      return;
    }
    setEditorMessage(null);
  }

  async function handleSaveStorybookMeta() {
    const title = storybookTitleDraft.trim();
    const subtitle = storybookSubtitleDraft.trim();
    if (!title) {
      setEditorMessage("Storybook title is required.");
      return;
    }

    const changedTitle = title !== storybook.title;
    const changedSubtitle = subtitle !== (storybook.subtitle ?? "");
    if (!changedTitle && !changedSubtitle) return;

    startStorybookSave(() => {
      void (async () => {
        const result = await renameStorybookAction(storybook.id, {
          title,
          subtitle: subtitle || null
        });
        if (!result.ok) {
          setEditorMessage(result.error);
          return;
        }
        setStorybook(result.data);
        setStorybookTitleDraft(result.data.title);
        setStorybookSubtitleDraft(result.data.subtitle ?? "");
        setEditorMessage(null);
        trackStorybookRename({
          storybook_id: storybook.id,
          title_changed: changedTitle,
          subtitle_changed: changedSubtitle
        });
      })();
    });
  }

  async function handleSaveSelectedChapterTitle() {
    if (!selectedChapter) return;
    const nextTitle = chapterTitleDraft.trim();
    if (!nextTitle) {
      setEditorMessage("Chapter title is required.");
      return;
    }
    if (nextTitle === selectedChapter.title) return;

    startChapterTitleSave(() => {
      void handleRenameChapter(selectedChapter.id, nextTitle);
    });
  }

  async function handleInsertTextBlock(chapterId: string) {
    const result = await insertTextBlockAction(storybook.id, chapterId);
    if (!result.ok) {
      setEditorMessage(result.error);
      return;
    }
    setBlocksByChapterId((current) => ({
      ...current,
      [chapterId]: sortByOrderIndex([...(current[chapterId] ?? []), result.data])
    }));
    setDraftsByBlockId((current) => ({
      ...current,
      [result.data.id]: normalizeTextBlockContent(result.data.content).html
    }));
    setEditorMessage(null);
  }

  async function handleInsertImagePlaceholderBlock(chapterId: string) {
    const result = await insertImagePlaceholderBlockAction(storybook.id, chapterId);
    if (!result.ok) {
      setEditorMessage(result.error);
      return;
    }
    setBlocksByChapterId((current) => ({
      ...current,
      [chapterId]: sortByOrderIndex([...(current[chapterId] ?? []), result.data])
    }));
    setEditorMessage(null);
  }

  async function handleUpdateBlock(input: {
    storybookId: string;
    blockId: string;
    content: Record<string, unknown>;
    expectedVersion?: number;
    overwrite?: boolean;
  }) {
    const result = await updateBlockAction(input.storybookId, input.blockId, {
      content: input.content,
      expectedVersion: input.overwrite ? undefined : input.expectedVersion
    });
    if (!result.ok) {
      setEditorMessage(result.code === "conflict" ? null : result.error);
      return result;
    }

    setBlocksByChapterId((current) => {
      const next = { ...current };
      for (const [chapterId, blocks] of Object.entries(next)) {
        const index = blocks.findIndex((block) => block.id === result.data.id);
        if (index < 0) continue;
        const updated = [...blocks];
        updated[index] = result.data;
        next[chapterId] = sortByOrderIndex(updated);
        break;
      }
      return next;
    });
    if (result.data.type === "TEXT") {
      setDraftsByBlockId((current) => ({
        ...current,
        [result.data.id]: normalizeTextBlockContent(result.data.content).html
      }));
    }
    return result;
  }

  async function handleDeleteBlock(blockId: string) {
    const result = await removeBlockAction(storybook.id, blockId);
    if (!result.ok) {
      setEditorMessage(result.error);
      return;
    }

    setBlocksByChapterId((current) => {
      const next: Record<string, BlockDTO[]> = {};
      for (const [chapterId, blocks] of Object.entries(current)) {
        const filtered = blocks.filter((block) => block.id !== blockId);
        next[chapterId] = filtered.map((block, index) =>
          block.order_index === index ? block : { ...block, order_index: index }
        );
      }
      return next;
    });
    setDraftsByBlockId((current) => {
      const next = { ...current };
      delete next[blockId];
      return next;
    });
    setEditorMessage(null);
  }

  async function handleReloadCurrentChapter() {
    if (!selectedChapterId) return;
    await loadBlocksForChapter(selectedChapterId, true);
  }

  function handleBlockSaved(block: BlockDTO) {
    setBlocksByChapterId((current) => {
      const next = { ...current };
      const chapterBlocks = [...(next[block.chapter_id] ?? [])];
      const index = chapterBlocks.findIndex((item) => item.id === block.id);
      if (index >= 0) {
        chapterBlocks[index] = block;
      } else {
        chapterBlocks.push(block);
      }
      next[block.chapter_id] = sortByOrderIndex(chapterBlocks);
      return next;
    });

    if (!firstSavedChaptersRef.current.has(block.chapter_id)) {
      firstSavedChaptersRef.current.add(block.chapter_id);
      trackChapterFirstSave({
        storybook_id: storybook.id,
        chapter_id: block.chapter_id
      });
    }
  }

  const sidebar = (
    <ChaptersSidebar
      chapters={chapters}
      selectedChapterId={selectedChapterId}
      onSelectChapter={(chapterId) => {
        void handleSelectChapter(chapterId);
      }}
      onAddChapter={handleAddChapter}
      onRenameChapter={handleRenameChapter}
      onDeleteChapter={handleDeleteChapter}
      onReorderChapters={handleReorderChapters}
    />
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="hidden lg:block">{sidebar}</div>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gold/80">Storybook Editor</p>
              <p className="text-sm text-white/60">
                Chapters, blocks, and autosave now persist to Convex.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="lg:hidden"
              onClick={() => {
                if (mobileDialogRef.current?.open) return;
                mobileDialogRef.current?.showModal();
                setIsMobileSidebarOpen(true);
              }}
            >
              Chapters
            </Button>
          </div>

          {editorMessage ? (
            <div className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {editorMessage}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label htmlFor="storybook-title" className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/55">
                Title
              </label>
              <input
                id="storybook-title"
                type="text"
                value={storybookTitleDraft}
                onChange={(event) => setStorybookTitleDraft(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label htmlFor="storybook-subtitle" className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/55">
                Subtitle
              </label>
              <input
                id="storybook-subtitle"
                type="text"
                value={storybookSubtitleDraft}
                onChange={(event) => setStorybookSubtitleDraft(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/50"
                placeholder="Optional subtitle"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" loading={isSavingStorybook} onClick={handleSaveStorybookMeta}>
                Save Storybook
              </Button>
            </div>
          </div>
        </Card>

        {selectedChapter ? (
          <Card className="sticky top-20 z-10 border-white/15 bg-[#0a1321]/85 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="selected-chapter-title"
                  className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/55"
                >
                  Active chapter
                </label>
                <input
                  ref={chapterTitleInputRef}
                  id="selected-chapter-title"
                  type="text"
                  value={chapterTitleDraft}
                  onChange={(event) =>
                    setChapterTitleDraftsById((current) => ({
                      ...current,
                      [selectedChapter.id]: event.target.value
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/50"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                loading={isSavingChapterTitle}
                onClick={handleSaveSelectedChapterTitle}
              >
                Save Chapter Title
              </Button>
            </div>
            <p className="mt-2 text-xs text-white/45">
              {selectedBlocks.length} blocks in this chapter
            </p>
          </Card>
        ) : null}

        {selectedChapter ? (
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-parchment">{selectedChapter.title}</h2>
                <p className="text-sm text-white/60">
                  Autosave runs after a short pause. Conflicts are detected by block version.
                </p>
              </div>
              {blocksLoadingChapterId === selectedChapter.id ? (
                <p className="text-xs text-white/55">Loading chapter...</p>
              ) : null}
            </div>

            <BlockList
              storybookId={storybook.id}
              chapterId={selectedChapter.id}
              chapterTitle={selectedChapter.title}
              blocks={selectedBlocks}
              draftsByBlockId={draftsByBlockId}
              onDraftChange={(blockId, html) => {
                setDraftsByBlockId((current) => ({ ...current, [blockId]: html }));
              }}
              onInsertTextBlock={handleInsertTextBlock}
              onInsertImagePlaceholderBlock={handleInsertImagePlaceholderBlock}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
              onBlockSaved={handleBlockSaved}
              onReloadChapter={handleReloadCurrentChapter}
            />
          </Card>
        ) : (
          <Card className="p-6">
            <p className="text-sm text-white/70">
              This storybook has no chapters yet. Add one from the chapters panel to begin writing.
            </p>
            <div className="mt-4">
              <Button type="button" onClick={() => void handleAddChapter()}>
                Add First Chapter
              </Button>
            </div>
          </Card>
        )}
      </div>

      <dialog
        ref={mobileDialogRef}
        className="m-0 h-full w-full max-w-none bg-black/55 p-0 backdrop:bg-black/55 lg:hidden"
        onClose={() => setIsMobileSidebarOpen(false)}
      >
        <div className="mx-auto flex h-full max-w-xl flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-parchment">Chapters</p>
            <Button type="button" variant="ghost" onClick={() => mobileDialogRef.current?.close()}>
              Close
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">{sidebar}</div>
        </div>
      </dialog>
    </div>
  );
}
