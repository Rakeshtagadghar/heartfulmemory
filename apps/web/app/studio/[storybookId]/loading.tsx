import Link from "next/link";
import { Card } from "../../../components/ui/card";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} aria-hidden />;
}

export default function StudioAliasLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Card className="p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-gold/75">Preparing your chapter...</p>
        <Skeleton className="mt-3 h-8 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/app/storybooks"
            className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/65 hover:bg-white/[0.03]"
          >
            Back
          </Link>
        </div>
      </Card>
    </div>
  );
}
