import Link from "next/link";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { StorybookDTO } from "../../lib/dto/storybook";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function StorybooksList({
  storybooks,
  emptyMessage = "No storybooks yet. Start one from the create flow."
}: {
  storybooks: StorybookDTO[];
  emptyMessage?: string;
}) {
  if (storybooks.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-white/70">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {storybooks.map((book) => (
        <Card key={book.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-parchment">{book.title}</h3>
                <Badge className="border-white/15 bg-white/[0.03] text-white/80">{book.status}</Badge>
              </div>
              {book.subtitle ? <p className="mt-1 text-sm text-white/65">{book.subtitle}</p> : null}
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/45">
                {book.book_mode} · Updated {formatDate(book.updated_at)}
              </p>
            </div>
            <Link
              href={`/app/storybooks/${book.id}`}
              className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white hover:bg-white/[0.06]"
            >
              Open
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

