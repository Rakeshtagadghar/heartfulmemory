"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "../ui/button";
import { trackPopulateChapterStart } from "../../lib/analytics/studioChapterFlow";

export function OpenInStudioButton({
  href,
  chapterKey,
  className
}: {
  href: string;
  chapterKey: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className ?? "text-cyan-100 hover:text-cyan-50"}
      loading={isPending}
      onClick={() => {
        trackPopulateChapterStart({ chapterKey });
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {isPending ? "Preparing your chapter..." : "Open in Studio"}
    </Button>
  );
}
