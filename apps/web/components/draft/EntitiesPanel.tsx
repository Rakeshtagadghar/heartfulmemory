import Link from "next/link";
import type { ChapterDraftEntitiesV2 } from "../../../../packages/shared/entities/entitiesTypes";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { buildWizardQuestionDeepLink } from "../../lib/routes/wizardDeepLink";

type DraftWarning = { code: string; message: string; severity: "info" | "warning" | "error" };

function confidenceTone(confidence: number) {
  if (confidence >= 0.85) return "text-emerald-100 border-emerald-300/20 bg-emerald-400/10";
  if (confidence >= 0.55) return "text-amber-100 border-amber-300/20 bg-amber-400/10";
  return "text-rose-100 border-rose-300/20 bg-rose-400/10";
}

function CitationLinks({
  citations,
  storybookId,
  chapterInstanceId
}: {
  citations: string[];
  storybookId: string;
  chapterInstanceId: string;
}) {
  const safe = citations.filter((citation) => /^q[_a-z0-9-]+$/i.test(citation));
  if (safe.length === 0) return <span className="italic text-white/40">none</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {safe.map((citation) => (
        <Link
          key={citation}
          href={buildWizardQuestionDeepLink({ storybookId, chapterInstanceId, questionId: citation })}
          className="rounded-md border border-white/10 px-1.5 py-0.5 text-white/75 hover:border-gold/40 hover:text-parchment"
        >
          {citation}
        </Link>
      ))}
    </span>
  );
}

function EntityListSection({
  title,
  rows,
  storybookId,
  chapterInstanceId
}: {
  title: string;
  rows: Array<{ value: string; confidence: number; citations: string[]; kind?: string; normalized?: string }>;
  storybookId: string;
  chapterInstanceId: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.14em] text-white/45">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-white/55">None</p>
      ) : (
        rows.map((row) => (
          <div key={`${title}:${row.value}:${row.normalized ?? ""}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-white/85">{row.value}</p>
              {row.kind ? (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/60">{row.kind}</span>
              ) : null}
              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${confidenceTone(row.confidence)}`}>
                {Math.round(row.confidence * 100)}%
              </span>
              {row.normalized && row.normalized !== row.value ? (
                <span className="text-[11px] text-white/50">normalized: {row.normalized}</span>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-white/55">
              Citations:{" "}
              <CitationLinks citations={row.citations} storybookId={storybookId} chapterInstanceId={chapterInstanceId} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function EntitiesPanel({
  entitiesV2,
  storybookId,
  chapterInstanceId,
  warnings,
  retryAction
}: {
  entitiesV2: ChapterDraftEntitiesV2 | null | undefined;
  storybookId: string;
  chapterInstanceId: string;
  warnings?: DraftWarning[];
  retryAction?: () => Promise<void>;
}) {
  const extractorUnavailable = (warnings ?? []).some((warning) => warning.code === "ENTITY_EXTRACTOR_UNAVAILABLE");
  const hasEntities =
    Boolean(entitiesV2) &&
    ((entitiesV2?.people.length ?? 0) > 0 || (entitiesV2?.places.length ?? 0) > 0 || (entitiesV2?.dates.length ?? 0) > 0);
  const showEmptyState = hasEntities === false;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Entities</p>
          <p className="mt-1 text-xs text-white/55">People, places, and dates extracted from chapter answers only.</p>
        </div>
        {entitiesV2 ? (
          <span className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-1 text-[11px] text-white/55">
            {`v${entitiesV2.meta.version} / ${entitiesV2.meta.generator}`}
          </span>
        ) : null}
      </div>

      {showEmptyState ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-sm text-white/70">
            {extractorUnavailable ? "Entity extraction is currently unavailable for this draft." : "No entities detected yet."}
          </p>
          {retryAction ? (
            <form action={retryAction} className="mt-3">
              <Button type="submit" variant="secondary" size="sm">
                Try Again
              </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <EntityListSection
            title="People"
            rows={(entitiesV2?.people ?? []).map((row) => ({
              value: row.value,
              confidence: row.confidence,
              citations: row.citations,
              kind: row.kind
            }))}
            storybookId={storybookId}
            chapterInstanceId={chapterInstanceId}
          />
          <EntityListSection
            title="Places"
            rows={(entitiesV2?.places ?? []).map((row) => ({
              value: row.value,
              confidence: row.confidence,
              citations: row.citations
            }))}
            storybookId={storybookId}
            chapterInstanceId={chapterInstanceId}
          />
          <EntityListSection
            title="Dates"
            rows={(entitiesV2?.dates ?? []).map((row) => ({
              value: row.value,
              normalized: row.normalized,
              confidence: row.confidence,
              citations: row.citations
            }))}
            storybookId={storybookId}
            chapterInstanceId={chapterInstanceId}
          />
        </div>
      )}
    </Card>
  );
}
