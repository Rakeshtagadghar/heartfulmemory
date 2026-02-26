import { Card } from "../ui/card";
import { CitationsRow } from "./CitationsRow";
import { TrackedDraftActionButton } from "./TrackedDraftActionButton";

type Section = {
  sectionId: string;
  title: string;
  text: string;
  wordCount: number;
  citations: string[];
  uncertain?: boolean;
};

export function DraftSectionCard({
  section,
  canRegen,
  regenAction,
  analytics
}: {
  section: Section;
  canRegen: boolean;
  regenAction?: (formData: FormData) => Promise<void>;
  analytics?: {
    chapterKey: string;
    voice: string;
    tense: string;
    tone: string;
    length: string;
    provider: string;
  };
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-parchment">{section.title}</p>
            <span className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-xs text-white/55">
              {section.sectionId}
            </span>
            {section.uncertain ? (
              <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-100">
                uncertain
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-white/50">{section.wordCount} words</p>
        </div>

        {canRegen && regenAction ? (
          <form action={regenAction}>
            <input type="hidden" name="sectionId" value={section.sectionId} />
            <TrackedDraftActionButton
              type="submit"
              variant="secondary"
              size="sm"
              eventName="draft_regen_section_start"
              eventProps={{
                sectionId: section.sectionId,
                provider: analytics?.provider,
                chapterKey: analytics?.chapterKey,
                voice: analytics?.voice,
                tense: analytics?.tense,
                tone: analytics?.tone,
                length: analytics?.length
              }}
            >
              Regenerate Section
            </TrackedDraftActionButton>
          </form>
        ) : null}
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/80">{section.text || "No text yet."}</p>
      <div className="mt-3">
        <CitationsRow citations={section.citations} />
      </div>
    </Card>
  );
}
