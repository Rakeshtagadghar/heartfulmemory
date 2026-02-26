import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "../../../../../../components/ui/card";
import { ButtonLink } from "../../../../../../components/ui/button";
import { Badge } from "../../../../../../components/ui/badge";
import { ViewportEvent } from "../../../../../../components/viewport-event";
import { DraftSectionCard } from "../../../../../../components/draft/DraftSectionCard";
import { DraftSummary } from "../../../../../../components/draft/DraftSummary";
import { DraftWarnings } from "../../../../../../components/draft/DraftWarnings";
import { TrackedDraftActionButton } from "../../../../../../components/draft/TrackedDraftActionButton";
import { NarrationSettingsPanel } from "../../../../../../components/story/NarrationSettingsPanel";
import { requireAuthenticatedUser } from "../../../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../../../lib/profile";
import {
  approveChapterDraftForUser,
  generateChapterDraftForUser,
  getGuidedStorybookByIdForUser,
  getLatestChapterDraftForUser,
  listChapterDraftVersionsForUser,
  listGuidedChaptersByStorybookForUser,
  regenChapterDraftSectionForUser,
  updateGuidedNarrationForUser
} from "../../../../../../lib/data/create-flow";

type Props = {
  params: Promise<{ storybookId: string; chapterInstanceId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

function draftUrl(
  storybookId: string,
  chapterInstanceId: string,
  params?: Record<string, string | number | null | undefined>
) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value == null || value === "") continue;
    qs.set(key, String(value));
  }
  const query = qs.toString();
  return `/book/${storybookId}/chapters/${chapterInstanceId}/draft${query ? `?${query}` : ""}`;
}

function readNarrationFormValue(formData: FormData) {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    voice: read("voice") === "first_person" ? ("first_person" as const) : ("third_person" as const),
    tense: read("tense") === "present" ? ("present" as const) : ("past" as const),
    tone:
      read("tone") === "formal" || read("tone") === "playful" || read("tone") === "poetic"
        ? (read("tone") as "formal" | "playful" | "poetic")
        : ("warm" as const),
    length:
      read("length") === "short" || read("length") === "long"
        ? (read("length") as "short" | "long")
        : ("medium" as const)
  };
}

function sameNarration(a: Record<string, unknown> | null | undefined, b: Record<string, unknown> | null | undefined) {
  return (
    (a?.voice ?? "third_person") === (b?.voice ?? "third_person") &&
    (a?.tense ?? "past") === (b?.tense ?? "past") &&
    (a?.tone ?? "warm") === (b?.tone ?? "warm") &&
    (a?.length ?? "medium") === (b?.length ?? "medium")
  );
}

function mapDraftErrorCode(errorCode: string | undefined) {
  if (!errorCode) return null;
  const mapping: Record<string, string> = {
    RATE_LIMIT: "Too many generation requests. Please wait a minute and try again.",
    CHAPTER_NOT_COMPLETED: "Complete this chapter before generating a draft.",
    NO_ANSWERS: "No usable answers were found for this chapter.",
    DRAFT_ALREADY_GENERATING: "A draft generation job is already running for this chapter.",
    INVALID_SECTION: "That section could not be regenerated.",
    GENERATION_EMPTY: "The generated draft was empty. Try again.",
    PROVIDER_ERROR: "The AI provider failed. Please try again.",
    generation_failed: "Draft generation failed. Please try again.",
    regen_failed: "Section regeneration failed. Please try again.",
    approve_failed: "Could not approve the draft."
  };
  return mapping[errorCode] ?? "Something went wrong while generating the draft.";
}

export default async function ChapterDraftReviewPage({ params, searchParams }: Props) {
  const { storybookId, chapterInstanceId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(draftUrl(storybookId, chapterInstanceId));
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) redirect("/app/onboarding");

  const [storybook, chapters, latestDraft, draftVersions] = await Promise.all([
    getGuidedStorybookByIdForUser(user.id, storybookId),
    listGuidedChaptersByStorybookForUser(user.id, storybookId),
    getLatestChapterDraftForUser(user.id, chapterInstanceId),
    listChapterDraftVersionsForUser(user.id, chapterInstanceId)
  ]);

  if (!storybook.ok) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <p className="text-sm text-rose-100">Could not load storybook: {storybook.error}</p>
        </Card>
      </div>
    );
  }
  if (!chapters.ok) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <p className="text-sm text-rose-100">Could not load chapter list: {chapters.error}</p>
        </Card>
      </div>
    );
  }

  const chapter = chapters.data.find((item) => item.id === chapterInstanceId) ?? null;
  if (!chapter) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <p className="text-sm text-rose-100">Chapter not found for this storybook.</p>
          <div className="mt-4">
            <ButtonLink href={`/book/${storybookId}/chapters`} variant="secondary">
              Back to Chapters
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const latest = latestDraft.ok ? latestDraft.data : null;
  const versions = draftVersions.ok ? draftVersions.data : [];

  async function saveNarrationSettings(formData: FormData) {
    "use server";
    const currentUser = await requireAuthenticatedUser(draftUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) redirect("/app/onboarding");
    const result = await updateGuidedNarrationForUser(currentUser.id, storybookId, readNarrationFormValue(formData));
    if (!result.ok) {
      redirect(draftUrl(storybookId, chapterInstanceId, { narrationError: 1 }));
    }
    redirect(draftUrl(storybookId, chapterInstanceId, { narrationSaved: 1 }));
  }

  async function generateDraft() {
    "use server";
    const currentUser = await requireAuthenticatedUser(draftUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) redirect("/app/onboarding");
    const result = await generateChapterDraftForUser(currentUser.id, { storybookId, chapterInstanceId });
    if (!result.ok) {
      redirect(draftUrl(storybookId, chapterInstanceId, { error: "generation_failed" }));
    }
    if (!result.data.ok) {
      redirect(draftUrl(storybookId, chapterInstanceId, { error: result.data.errorCode }));
    }
    redirect(
      draftUrl(storybookId, chapterInstanceId, {
        notice: "generated",
        provider: result.data.provider,
        version: result.data.draft.version
      })
    );
  }

  async function regenSection(formData: FormData) {
    "use server";
    const currentUser = await requireAuthenticatedUser(draftUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) redirect("/app/onboarding");
    const sectionIdValue = formData.get("sectionId");
    const sectionId = typeof sectionIdValue === "string" ? sectionIdValue : "";
    const result = await regenChapterDraftSectionForUser(currentUser.id, {
      storybookId,
      chapterInstanceId,
      sectionId
    });
    if (!result.ok) {
      redirect(draftUrl(storybookId, chapterInstanceId, { error: "regen_failed" }));
    }
    if (!result.data.ok) {
      redirect(draftUrl(storybookId, chapterInstanceId, { error: result.data.errorCode }));
    }
    redirect(
      draftUrl(storybookId, chapterInstanceId, {
        notice: "regen_success",
        sectionId,
        provider: result.data.provider,
        version: result.data.draft.version
      })
    );
  }

  async function approveDraft(formData: FormData) {
    "use server";
    const currentUser = await requireAuthenticatedUser(draftUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) redirect("/app/onboarding");
    const draftIdValue = formData.get("draftId");
    const draftId = typeof draftIdValue === "string" ? draftIdValue : "";
    const result = await approveChapterDraftForUser(currentUser.id, draftId);
    if (!result.ok) redirect(draftUrl(storybookId, chapterInstanceId, { error: "approve_failed" }));
    redirect(draftUrl(storybookId, chapterInstanceId, { notice: "approved" }));
  }

  const notice = getSearchString(resolvedSearchParams, "notice");
  const providerFromQuery = getSearchString(resolvedSearchParams, "provider") ?? "heuristic";
  const errorCode = getSearchString(resolvedSearchParams, "error");
  const narrationMismatch = latest ? !sameNarration(latest.narration, storybook.data.narration) : false;
  const narrationForAnalytics = (storybook.data.narration ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <ViewportEvent eventName="draft_review_view" eventProps={{ chapterKey: chapter.chapterKey }} />
      {notice === "generated" ? (
        <ViewportEvent
          eventName="draft_generate_success"
          eventProps={{
            provider: providerFromQuery,
            chapterKey: chapter.chapterKey,
            voice: String(narrationForAnalytics.voice ?? "third_person"),
            tense: String(narrationForAnalytics.tense ?? "past"),
            tone: String(narrationForAnalytics.tone ?? "warm"),
            length: String(narrationForAnalytics.length ?? "medium")
          }}
        />
      ) : null}
      {notice === "regen_success" ? (
        <ViewportEvent
          eventName="draft_regen_section_success"
          eventProps={{
            provider: providerFromQuery,
            chapterKey: chapter.chapterKey,
            sectionId: getSearchString(resolvedSearchParams, "sectionId") ?? "",
            voice: String(narrationForAnalytics.voice ?? "third_person"),
            tense: String(narrationForAnalytics.tense ?? "past"),
            tone: String(narrationForAnalytics.tone ?? "warm"),
            length: String(narrationForAnalytics.length ?? "medium")
          }}
        />
      ) : null}
      {errorCode ? (
        <ViewportEvent
          eventName={errorCode === "regen_failed" ? "draft_regen_section_error" : "draft_generate_error"}
          eventProps={{
            error_code: errorCode,
            provider: providerFromQuery,
            chapterKey: chapter.chapterKey,
            voice: String(narrationForAnalytics.voice ?? "third_person"),
            tense: String(narrationForAnalytics.tense ?? "past"),
            tone: String(narrationForAnalytics.tone ?? "warm"),
            length: String(narrationForAnalytics.length ?? "medium")
          }}
        />
      ) : null}

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gold/75">Chapter Draft Review</p>
            <h1 className="mt-2 font-display text-3xl text-parchment sm:text-4xl">{chapter.title}</h1>
            <p className="mt-2 text-sm text-white/70">
              {storybook.data.title} / {chapter.chapterKey}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/15 bg-white/[0.03] text-white/80">{chapter.status}</Badge>
            <Link
              href={`/book/${storybookId}/chapters`}
              className="inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/75 hover:bg-white/[0.03]"
            >
              Back to Chapters
            </Link>
          </div>
        </div>
      </Card>

      {notice === "approved" ? (
        <Card className="p-4">
          <p className="text-sm text-emerald-100">Draft approved. Studio population happens in a later sprint.</p>
        </Card>
      ) : null}
      {notice === "generated" ? (
        <Card className="p-4">
          <p className="text-sm text-emerald-100">Draft generated successfully.</p>
        </Card>
      ) : null}
      {notice === "regen_success" ? (
        <Card className="p-4">
          <p className="text-sm text-emerald-100">
            Section regenerated: {getSearchString(resolvedSearchParams, "sectionId")}.
          </p>
        </Card>
      ) : null}
      {getSearchString(resolvedSearchParams, "narrationSaved") === "1" ? (
        <Card className="p-4">
          <p className="text-sm text-emerald-100">
            Narration settings saved. Regenerate the draft to apply changes.
          </p>
        </Card>
      ) : null}
      {getSearchString(resolvedSearchParams, "narrationError") === "1" ? (
        <Card className="p-4">
          <p className="text-sm text-rose-100">Could not save narration settings.</p>
        </Card>
      ) : null}
      {errorCode ? (
        <Card className="p-4">
          <p className="text-sm text-rose-100">{mapDraftErrorCode(errorCode)}</p>
        </Card>
      ) : null}

      <NarrationSettingsPanel
        narration={storybook.data.narration}
        action={saveNarrationSettings}
        subtitle="These settings are saved on the storybook and applied when generating or regenerating chapter drafts."
      />

      {narrationMismatch ? (
        <Card className="p-4">
          <p className="text-sm text-amber-100">
            Narration settings changed after this draft was generated. Regenerate the draft to apply the latest style.
          </p>
        </Card>
      ) : null}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-parchment">Draft Actions</p>
            <p className="text-xs text-white/55">
              Generate a new chapter draft, regenerate individual sections, then approve this version.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={generateDraft}>
              <TrackedDraftActionButton
                type="submit"
                eventName="draft_generate_start"
                eventProps={{
                  provider: providerFromQuery,
                  chapterKey: chapter.chapterKey,
                  voice: String(narrationForAnalytics.voice ?? "third_person"),
                  tense: String(narrationForAnalytics.tense ?? "past"),
                  tone: String(narrationForAnalytics.tone ?? "warm"),
                  length: String(narrationForAnalytics.length ?? "medium")
                }}
              >
                {latest ? "Regenerate Full Draft" : "Generate Draft"}
              </TrackedDraftActionButton>
            </form>
            <ButtonLink href={`/book/${storybookId}/chapters/${chapterInstanceId}/wizard`} variant="secondary">
              Edit Answers
            </ButtonLink>
            <ButtonLink href={`/book/${storybookId}/chapters/${chapterInstanceId}/illustrations`} variant="secondary">
              Review Illustrations
            </ButtonLink>
          </div>
        </div>
      </Card>

      <DraftSummary
        summary={latest?.summary ?? ""}
        sourceAnswerIds={latest?.sourceAnswerIds ?? []}
        status={latest?.status ?? "generating"}
        version={latest?.version ?? null}
        provider={providerFromQuery}
        updatedAt={latest?.updatedAt ?? null}
      />

      {latest ? <DraftWarnings warnings={latest.warnings ?? []} /> : null}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {!latest ? (
            <Card className="p-6">
              <p className="text-sm text-white/75">
                No draft yet. Generate a draft after completing the chapter questions.
              </p>
            </Card>
          ) : latest.status === "error" ? (
            <Card className="p-6">
              <p className="text-sm text-rose-100">
                Draft error: {latest.errorMessage ?? latest.errorCode ?? "Unknown error"}
              </p>
            </Card>
          ) : (
            latest.sections.map((section) => (
              <DraftSectionCard
                key={`${latest.id}-${section.sectionId}`}
                section={section}
                canRegen={latest.status === "ready"}
                regenAction={regenSection}
                analytics={{
                  chapterKey: chapter.chapterKey,
                  provider: providerFromQuery,
                  voice: String(narrationForAnalytics.voice ?? "third_person"),
                  tense: String(narrationForAnalytics.tense ?? "past"),
                  tone: String(narrationForAnalytics.tone ?? "warm"),
                  length: String(narrationForAnalytics.length ?? "medium")
                }}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Key Facts</p>
            <div className="mt-3 space-y-2">
              {(latest?.keyFacts ?? []).length === 0 ? (
                <p className="text-sm text-white/55">No key facts yet.</p>
              ) : (
                latest?.keyFacts.map((fact, idx) => (
                  <div key={`${fact.text}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-sm text-white/80">{fact.text}</p>
                    <p className="mt-1 text-xs text-white/50">Citations: {fact.citations.join(", ") || "none"}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Quotes</p>
            <div className="mt-3 space-y-2">
              {(latest?.quotes ?? []).length === 0 ? (
                <p className="text-sm text-white/55">No quotes extracted yet.</p>
              ) : (
                latest?.quotes.map((quote, idx) => (
                  <div key={`${quote.text}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-sm italic text-white/85">"{quote.text}"</p>
                    <p className="mt-1 text-xs text-white/50">Citations: {quote.citations.join(", ") || "none"}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Image Ideas (Sprint 20)</p>
            <div className="mt-3 space-y-2">
              {(latest?.imageIdeas ?? []).length === 0 ? (
                <p className="text-sm text-white/55">No image ideas yet.</p>
              ) : (
                latest?.imageIdeas.map((idea, idx) => (
                  <div key={`${idea.query}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-sm font-medium text-white/85">{idea.query}</p>
                    <p className="mt-1 text-xs text-white/55">{idea.reason}</p>
                    {idea.slotHint ? <p className="mt-1 text-xs text-white/45">Slot hint: {idea.slotHint}</p> : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Entities</p>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              <p>People: {(latest?.entities.people ?? []).join(", ") || "None"}</p>
              <p>Places: {(latest?.entities.places ?? []).join(", ") || "None"}</p>
              <p>Dates: {(latest?.entities.dates ?? []).join(", ") || "None"}</p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Version History</p>
            <div className="mt-3 space-y-2">
              {versions.length === 0 ? (
                <p className="text-sm text-white/55">No versions yet.</p>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-white/80">v{version.version}</p>
                      <p className="text-xs text-white/50">{version.status}</p>
                    </div>
                    {version.approvedAt ? (
                      <span className="text-xs font-semibold text-emerald-100">Approved</span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-sm font-semibold text-parchment">Approve Draft</p>
            <p className="mt-1 text-xs text-white/55">
              Approving marks this version as reviewed. Studio population comes in Sprint 21.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={approveDraft}>
                <input type="hidden" name="draftId" value={latest?.id ?? ""} />
                <TrackedDraftActionButton
                  type="submit"
                  disabled={!latest || latest.status !== "ready"}
                  eventName="draft_approve"
                  eventProps={{
                    version: latest?.version ?? 0,
                    provider: providerFromQuery,
                    chapterKey: chapter.chapterKey,
                    voice: String(narrationForAnalytics.voice ?? "third_person"),
                    tense: String(narrationForAnalytics.tense ?? "past"),
                    tone: String(narrationForAnalytics.tone ?? "warm"),
                    length: String(narrationForAnalytics.length ?? "medium")
                  }}
                >
                  Approve Draft
                </TrackedDraftActionButton>
              </form>
              <span className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm text-white/40">
                Continue to Studio (Sprint 21)
              </span>
            </div>
          </Card>
        </div>
      </div>

      {!draftVersions.ok ? (
        <Card className="p-4">
          <p className="text-xs text-white/55">Draft history warning: {draftVersions.error}</p>
        </Card>
      ) : null}
      {!latestDraft.ok ? (
        <Card className="p-4">
          <p className="text-xs text-white/55">Draft query warning: {latestDraft.error}</p>
        </Card>
      ) : null}
    </div>
  );
}
