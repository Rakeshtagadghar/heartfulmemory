import Link from "next/link";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

export function DraftHeader({
  chapterTitle,
  chapterKey,
  chapterStatus,
  storybookTitle,
  storybookId
}: {
  chapterTitle: string;
  chapterKey: string;
  chapterStatus: string;
  storybookTitle: string;
  storybookId: string;
}) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gold/75">Chapter Draft Review</p>
          <h1 className="mt-2 font-display text-3xl text-parchment sm:text-4xl">{chapterTitle}</h1>
          <p className="mt-2 text-sm text-white/70">
            {storybookTitle} / {chapterKey}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-white/15 bg-white/[0.03] text-white/80">{chapterStatus}</Badge>
          <Link
            href={`/book/${storybookId}/chapters`}
            className="inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/75 hover:bg-white/[0.03]"
          >
            Back to Chapters
          </Link>
        </div>
      </div>
    </Card>
  );
}

