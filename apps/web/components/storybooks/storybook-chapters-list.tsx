import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { ChapterDTO } from "../../lib/dto/chapter";

export function StorybookChaptersList({
  chapters
}: {
  chapters: ChapterDTO[];
}) {
  if (chapters.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-white/70">No chapters yet. Add one in the editor flow (Sprint 5+) or use a template start.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {chapters.map((chapter, index) => (
        <Card key={chapter.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Chapter {index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold text-parchment">{chapter.title}</h3>
              {chapter.summary ? <p className="mt-2 text-sm text-white/70">{chapter.summary}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-white/15 bg-white/[0.03] text-white/80">{chapter.status}</Badge>
              <span className="text-xs text-white/45">Order {chapter.order_index}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

