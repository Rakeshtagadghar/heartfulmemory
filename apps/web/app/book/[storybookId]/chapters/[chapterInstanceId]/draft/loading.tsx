import { Card } from "../../../../../../components/ui/card";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} aria-hidden />;
}

export default function ChapterDraftLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Card className="p-6 sm:p-8">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-3 h-10 w-72 max-w-full" />
        <Skeleton className="mt-2 h-4 w-52" />
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="mt-2 h-4 w-20" />
              <Skeleton className="mt-4 h-20 w-full" />
              <Skeleton className="mt-2 h-4 w-32" />
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-16 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
