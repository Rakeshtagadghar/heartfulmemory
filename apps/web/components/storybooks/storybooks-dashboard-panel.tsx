"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import type { StorybookDTO } from "../../lib/dto/storybook";
import {
  createBlankStorybookAction,
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
            href="/app/start"
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
                      href={`/app/storybooks/${book.id}`}
                      className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white hover:bg-white/[0.06]"
                    >
                      Open
                    </Link>
                    {isEditing ? null : (
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
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

