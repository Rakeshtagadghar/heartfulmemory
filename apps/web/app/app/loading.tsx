import { Card } from "../../components/ui/card";

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-10 w-80 max-w-full animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-5/6 max-w-xl animate-pulse rounded bg-white/10" />
      </Card>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`app-loading-${index}`} className="p-5">
            <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-4 w-48 animate-pulse rounded bg-white/10" />
          </Card>
        ))}
      </div>
    </div>
  );
}

