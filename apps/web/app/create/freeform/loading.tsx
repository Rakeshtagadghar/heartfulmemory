import { Card } from "../../../components/ui/card";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} aria-hidden />;
}

export default function CreateFreeformLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Card className="p-6 sm:p-8">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-12 w-56 rounded-xl" />
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>
        </div>
      </Card>
    </div>
  );
}

