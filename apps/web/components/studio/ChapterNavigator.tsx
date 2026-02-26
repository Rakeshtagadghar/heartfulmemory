"use client";

import { TrackedLink } from "../tracked-link";
import { Button } from "../ui/button";
import { trackChapterMarkFinalized } from "../../lib/analytics/studioChapterFlow";

type ChapterNavLink = {
  href: string;
  chapterKey: string;
  label: string;
};

export function ChapterNavigator({
  title,
  chapterKey,
  statusLabel,
  previous,
  next,
  onFinalize,
  canFinalize
}: {
  title: string;
  chapterKey: string;
  statusLabel: "Draft" | "Populated" | "Edited" | "Finalized";
  previous?: ChapterNavLink | null;
  next?: ChapterNavLink | null;
  onFinalize?: (formData: FormData) => Promise<void>;
  canFinalize?: boolean;
}) {
  const statusClass =
    statusLabel === "Finalized"
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
      : statusLabel === "Edited"
        ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
        : statusLabel === "Populated"
          ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
          : "border-white/15 bg-white/[0.03] text-white/75";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0f131b]/85 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        {previous ? (
          <TrackedLink
            href={previous.href}
            eventName="studio_chapter_nav_prev"
            eventProps={{ chapterKey: previous.chapterKey }}
            className="inline-flex h-9 items-center rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/75 hover:bg-white/[0.03]"
          >
            Prev
          </TrackedLink>
        ) : (
          <span className="inline-flex h-9 items-center rounded-xl border border-white/5 px-3 text-xs text-white/35">
            Prev
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-parchment">{title}</p>
          <p className="truncate text-xs text-white/50">{chapterKey}</p>
        </div>

        {next ? (
          <TrackedLink
            href={next.href}
            eventName="studio_chapter_nav_next"
            eventProps={{ chapterKey: next.chapterKey }}
            className="inline-flex h-9 items-center rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/75 hover:bg-white/[0.03]"
          >
            Next
          </TrackedLink>
        ) : (
          <span className="inline-flex h-9 items-center rounded-xl border border-white/5 px-3 text-xs text-white/35">
            Next
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${statusClass}`}>
          {statusLabel}
        </span>
        {onFinalize ? (
          <form action={onFinalize}>
            <input type="hidden" name="chapterKey" value={chapterKey} />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={canFinalize === false}
              onClick={() => trackChapterMarkFinalized({ chapterKey })}
            >
              Mark Chapter as Laid Out
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
