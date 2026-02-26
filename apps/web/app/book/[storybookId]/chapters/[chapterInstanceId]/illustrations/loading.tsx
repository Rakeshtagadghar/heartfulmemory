import { Card } from "../../../../../../components/ui/card";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} aria-hidden />;
}

export default function ChapterIllustrationsLoading() {
  const cardSkeletonIds = ["slot-image1", "slot-image2", "slot-image3"];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Card className="p-6 sm:p-8">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-10 w-80 max-w-full" />
        <Skeleton className="mt-2 h-4 w-52" />
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cardSkeletonIds.map((skeletonId) => (
          <Card key={skeletonId} className="p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-4 w-48" />
            <Skeleton className="mt-3 h-52 w-full rounded-xl" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-2 h-3 w-40" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-9 w-16 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
