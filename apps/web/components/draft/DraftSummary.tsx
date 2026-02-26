import { Card } from "../ui/card";
import { CitationsRow } from "./CitationsRow";

export function DraftSummary({
  summary,
  sourceAnswerIds,
  status,
  version,
  provider,
  updatedAt
}: {
  summary: string;
  sourceAnswerIds: string[];
  status: "generating" | "ready" | "error";
  version: number | null;
  provider?: string | null;
  updatedAt?: number | null;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
          Draft {version != null ? `v${version}` : ""}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
          {status}
        </span>
        {provider ? (
          <span className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/60">
            {provider}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-white/80">
        {summary.trim() || "No summary yet. Generate a draft to see a chapter summary."}
      </p>
      <div className="mt-3 space-y-1">
        <CitationsRow citations={sourceAnswerIds} label="Source answers" />
        {updatedAt ? (
          <p className="text-xs text-white/45">Updated {new Date(updatedAt).toLocaleString()}</p>
        ) : null}
      </div>
    </Card>
  );
}

