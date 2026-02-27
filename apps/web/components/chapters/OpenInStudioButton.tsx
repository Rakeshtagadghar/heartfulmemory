"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "../ui/cn";
import { trackPopulateChapterStart } from "../../lib/analytics/studioChapterFlow";

export function OpenInStudioButton({
  href,
  chapterKey,
  className,
  iconOnly = false,
  ariaLabel = "Open in Studio"
}: {
  href: string;
  chapterKey: string;
  className?: string;
  iconOnly?: boolean;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (iconOnly) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-cyan-100 transition hover:bg-white/[0.08] hover:text-cyan-50",
          className,
          isPending && "cursor-wait opacity-80"
        )}
        onClick={() => {
          trackPopulateChapterStart({ chapterKey });
          startTransition(() => {
            router.push(href);
          });
        }}
      >
        {isPending ? (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 animate-spin"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3.2-6.9" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
            <path d="M5 5h6" />
            <path d="M5 5v6" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm font-semibold text-cyan-100 transition hover:border-gold/45 hover:bg-white/[0.06] hover:text-cyan-50",
        className,
        isPending && "cursor-wait opacity-80"
      )}
      disabled={isPending}
      onClick={() => {
        trackPopulateChapterStart({ chapterKey });
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {isPending ? "Preparing your chapter..." : "Open in Studio"}
    </button>
  );
}
