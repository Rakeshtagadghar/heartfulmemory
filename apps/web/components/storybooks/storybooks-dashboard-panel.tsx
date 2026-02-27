"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import type { StorybookDTO } from "../../lib/dto/storybook";
import {
  createBlankStorybookAction,
  removeStorybookFromDashboardAction,
  renameStorybookFromDashboardAction
} from "../../lib/actions/storybooks-dashboard";
import {
  trackStorybookCreateStart,
  trackStorybookRename
} from "../../lib/analytics/events_creation";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function sortRecent(storybooks: StorybookDTO[]) {
  return [...storybooks].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

async function createQuickBlankStorybook() {
  trackStorybookCreateStart({ source: "dashboard", kind: "blank" });
  await createBlankStorybookAction();
}

export function StorybooksDashboardPanel({
  initialStorybooks,
  initialError
}: {
  initialStorybooks: StorybookDTO[];
  initialError?: string | null;
}) {
  const [storybooks, setStorybooks] = useState(sortRecent(initialStorybooks));
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [subtitleDraft, setSubtitleDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState<StorybookDTO | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = storybooks.length;
  const orderedStorybooks = useMemo(() => sortRecent(storybooks), [storybooks]);

  async function handleRename(book: StorybookDTO) {
    const nextTitle = titleDraft.trim();
    const nextSubtitle = subtitleDraft.trim();
    if (!nextTitle) {
      setError("Storybook title is required.");
      return;
    }

    const changedTitle = nextTitle !== book.title;
    const changedSubtitle = nextSubtitle !== (book.subtitle ?? "");
    if (!changedTitle && !changedSubtitle) {
      setEditingId(null);
      return;
    }

    const result = await renameStorybookFromDashboardAction(book.id, {
      title: nextTitle,
      subtitle: nextSubtitle || null
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setStorybooks((current) => current.map((item) => (item.id === book.id ? result.data : item)));
    setEditingId(null);
    setError(null);
    trackStorybookRename({
      storybook_id: book.id,
      title_changed: changedTitle,
      subtitle_changed: changedSubtitle,
      source: "dashboard"
    });
  }

  async function handleDelete(book: StorybookDTO) {
    setDeletingId(book.id);
    const result = await removeStorybookFromDashboardAction(book.id);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setStorybooks((current) => current.filter((item) => item.id !== book.id));
    if (editingId === book.id) {
      setEditingId(null);
      setTitleDraft("");
      setSubtitleDraft("");
    }
    setConfirmDeleteBook((current) => (current?.id === book.id ? null : current));
    setError(null);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-parchment">Your storybooks</h2>
        <div className="flex items-center gap-2">
          <p className="text-sm text-white/55">{total} total</p>
          <Button
            type="button"
            size="sm"
            loading={isPending}
            onClick={() => {
              startTransition(() => {
                void createQuickBlankStorybook();
              });
            }}
          >
            Quick Blank
          </Button>
          <Link
            href="/create/template"
            className="inline-flex h-9 items-center rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm font-semibold text-white hover:bg-white/[0.06]"
          >
            Start Flow
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-rose-100">{error}</p>
            <Link href="/app" className="text-sm font-semibold text-gold hover:text-[#e3c17b]">
              Retry
            </Link>
          </div>
        </Card>
      ) : null}

      {orderedStorybooks.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-white/70">
            No storybooks yet. Start one from the create flow or create a quick blank draft.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orderedStorybooks.map((book) => {
            const isEditing = editingId === book.id;

            return (
              <Card key={book.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          startTransition(() => {
                            void handleRename(book);
                          });
                        }}
                      >
                        <div>
                          <label
                            htmlFor={`dashboard-title-${book.id}`}
                            className="mb-1 block text-xs uppercase tracking-[0.14em] text-white/55"
                          >
                            Title
                          </label>
                          <input
                            id={`dashboard-title-${book.id}`}
                            value={titleDraft}
                            onChange={(event) => setTitleDraft(event.target.value)}
                            className="h-10 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/50"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`dashboard-subtitle-${book.id}`}
                            className="mb-1 block text-xs uppercase tracking-[0.14em] text-white/55"
                          >
                            Subtitle
                          </label>
                          <input
                            id={`dashboard-subtitle-${book.id}`}
                            value={subtitleDraft}
                            onChange={(event) => setSubtitleDraft(event.target.value)}
                            className="h-10 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/50"
                            placeholder="Optional subtitle"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" size="sm" loading={isPending}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-parchment">{book.title}</h3>
                          <Badge className="border-white/15 bg-white/[0.03] text-white/80">
                            {book.status}
                          </Badge>
                        </div>
                        {book.subtitle ? <p className="mt-1 text-sm text-white/65">{book.subtitle}</p> : null}
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/45">
                          {book.book_mode} · Updated {formatDate(book.updated_at)}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/book/${book.id}/chapters`}
                      className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white hover:bg-white/[0.06]"
                    >
                      Open
                    </Link>
                    {isEditing ? null : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(book.id);
                            setTitleDraft(book.title);
                            setSubtitleDraft(book.subtitle ?? "");
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          loading={deletingId === book.id && isPending}
                          onClick={() => {
                            setConfirmDeleteBook(book);
                          }}
                          className="border-rose-300/20 text-rose-100 hover:border-rose-300/40 hover:bg-rose-500/10"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {confirmDeleteBook ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-storybook-title"
          aria-describedby="delete-storybook-desc"
        >
          <button
            type="button"
            aria-label="Close delete confirmation"
            className="absolute inset-0 bg-[#020617]/70 backdrop-blur-sm"
            onClick={() => {
              if (deletingId === confirmDeleteBook.id && isPending) return;
              setConfirmDeleteBook(null);
            }}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,20,36,0.96)_0%,rgba(9,14,26,0.96)_100%)] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_top,rgba(18,183,195,0.22),transparent_52%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.18em] text-rose-200/80">Delete Storybook</p>
              <h3 id="delete-storybook-title" className="mt-2 text-xl font-semibold text-parchment">
                Are you sure?
              </h3>
              <p id="delete-storybook-desc" className="mt-2 text-sm leading-6 text-white/70">
                This will permanently delete{" "}
                <span className="font-semibold text-white">{confirmDeleteBook.title}</span>, including its chapters and content.
                This action cannot be undone.
              </p>

              <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100/90">
                Proceed only if you are certain you no longer need this storybook.
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={deletingId === confirmDeleteBook.id && isPending}
                  onClick={() => setConfirmDeleteBook(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  loading={deletingId === confirmDeleteBook.id && isPending}
                  onClick={() => {
                    startTransition(() => {
                      void handleDelete(confirmDeleteBook);
                    });
                  }}
                  className="border-rose-300/30 bg-rose-500/10 text-rose-100 hover:border-rose-300/50 hover:bg-rose-500/15"
                >
                  Delete Storybook
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
