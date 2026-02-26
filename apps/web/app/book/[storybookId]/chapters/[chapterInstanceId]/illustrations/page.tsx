import { redirect } from "next/navigation";
import { Card } from "../../../../../../components/ui/card";
import { Badge } from "../../../../../../components/ui/badge";
import { ButtonLink } from "../../../../../../components/ui/button";
import { ViewportEvent } from "../../../../../../components/viewport-event";
import { SlotCard } from "../../../../../../components/illustrations/SlotCard";
import { ReplaceImagePicker } from "../../../../../../components/illustrations/ReplaceImagePicker";
import { TrackedIllustrationActionButton } from "../../../../../../components/illustrations/TrackedIllustrationActionButton";
import { requireAuthenticatedUser } from "../../../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../../../lib/profile";
import {
  autoIllustrateChapterForUser,
  cacheIllustrationAssetsForUser,
  fetchIllustrationCandidatesForUser,
  getChapterIllustrationSlotMapForUser,
  getGuidedStorybookByIdForUser,
  getLatestChapterDraftForUser,
  getLatestChapterIllustrationForUser,
  listChapterIllustrationVersionsForUser,
  listGuidedChaptersByStorybookForUser,
  replaceIllustrationSlotAssignmentForUser,
  type ProviderAssetCandidate,
  toggleIllustrationSlotLockForUser
} from "../../../../../../lib/data/create-flow";

type Props = {
  params: Promise<{ storybookId: string; chapterInstanceId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(searchParams: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

function routeUrl(
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
  return `/book/${storybookId}/chapters/${chapterInstanceId}/illustrations${query ? `?${query}` : ""}`;
}

function parseCandidateJson(raw: FormDataEntryValue | null): ProviderAssetCandidate | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.provider !== "unsplash" && parsed.provider !== "pexels") return null;
    if (typeof parsed.id !== "string" || typeof parsed.fullUrl !== "string" || typeof parsed.thumbUrl !== "string") return null;
    return {
      provider: parsed.provider,
      id: parsed.id,
      thumbUrl: parsed.thumbUrl,
      fullUrl: parsed.fullUrl,
      width: typeof parsed.width === "number" ? parsed.width : 0,
      height: typeof parsed.height === "number" ? parsed.height : 0,
      authorName: typeof parsed.authorName === "string" ? parsed.authorName : "Unknown",
      authorUrl: typeof parsed.authorUrl === "string" ? parsed.authorUrl : null,
      assetUrl: typeof parsed.assetUrl === "string" ? parsed.assetUrl : null,
      licenseUrl: typeof parsed.licenseUrl === "string" ? parsed.licenseUrl : null,
      attributionText: typeof parsed.attributionText === "string" ? parsed.attributionText : "Photo attribution",
      query: typeof parsed.query === "string" ? parsed.query : undefined
    };
  } catch {
    return null;
  }
}

function mapError(code: string | undefined) {
  if (!code) return null;
  const map: Record<string, string> = {
    DRAFT_NOT_READY: "Generate a chapter draft first before auto-illustrating.",
    RATE_LIMIT: "Too many illustration requests. Please wait and try again.",
    NO_CANDIDATES: "No print-safe images were found. Try regenerate or replace manually.",
    AUTO_ILLUSTRATE_FAILED: "Auto-illustrate failed. Please try again.",
    SEARCH_FAILED: "Could not load replacement search results.",
    REPLACE_FAILED: "Could not replace the selected slot.",
    LOCK_FAILED: "Could not update slot lock state."
  };
  return map[code] ?? "Something went wrong while loading illustrations.";
}

export default async function ChapterIllustrationsPage({ params, searchParams }: Props) {
  const { storybookId, chapterInstanceId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) redirect("/app/onboarding");

  const [storybook, chapters, latestDraft, latestIllustration, illustrationSlotMap, versions] = await Promise.all([
    getGuidedStorybookByIdForUser(user.id, storybookId),
    listGuidedChaptersByStorybookForUser(user.id, storybookId),
    getLatestChapterDraftForUser(user.id, chapterInstanceId),
    getLatestChapterIllustrationForUser(user.id, chapterInstanceId),
    getChapterIllustrationSlotMapForUser(user.id, chapterInstanceId),
    listChapterIllustrationVersionsForUser(user.id, chapterInstanceId)
  ]);

  if (!storybook.ok || !chapters.ok) {
    let contextError: string | undefined;
    if (!storybook.ok) contextError = storybook.error;
    else if (!chapters.ok) contextError = chapters.error;
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <p className="text-sm text-rose-100">
            Could not load chapter illustrations context: {contextError ?? "Unknown error"}
          </p>
        </Card>
      </div>
    );
  }

  const chapter = chapters.data.find((item) => item.id === chapterInstanceId) ?? null;
  if (!chapter) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <p className="text-sm text-rose-100">Chapter not found.</p>
        </Card>
      </div>
    );
  }

  const draft = latestDraft.ok ? latestDraft.data : null;
  const illustration = latestIllustration.ok ? latestIllustration.data : null;
  const illustrationId = illustration?.id ?? null;
  const slotMap = illustrationSlotMap.ok ? illustrationSlotMap.data : null;
  const versionList = versions.ok ? versions.data : [];

  async function runAutoIllustrate(regenerate: boolean) {
    "use server";
    const currentUser = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) redirect("/app/onboarding");

    const result = await autoIllustrateChapterForUser(currentUser.id, {
      storybookId,
      chapterInstanceId,
      providerMode: "both",
      regenerate
    });
    if (!result.ok) redirect(routeUrl(storybookId, chapterInstanceId, { error: "AUTO_ILLUSTRATE_FAILED" }));
    if (!result.data.ok) redirect(routeUrl(storybookId, chapterInstanceId, { error: result.data.errorCode }));
    redirect(
      routeUrl(storybookId, chapterInstanceId, {
        notice: regenerate ? "regenerated" : "generated",
        version: result.data.illustration.version
      })
    );
  }

  async function autoIllustrateAction() {
    "use server";
    return runAutoIllustrate(false);
  }

  async function regenerateAction() {
    "use server";
    return runAutoIllustrate(true);
  }

  async function toggleLockAction(formData: FormData) {
    "use server";
    const currentUser = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) redirect("/app/onboarding");
    const slotId = String(formData.get("slotId") ?? "");
    if (!illustrationId || !slotId) redirect(routeUrl(storybookId, chapterInstanceId, { error: "LOCK_FAILED" }));
    const result = await toggleIllustrationSlotLockForUser(currentUser.id, { illustrationId, slotId });
    if (!result.ok) redirect(routeUrl(storybookId, chapterInstanceId, { error: "LOCK_FAILED" }));
    redirect(routeUrl(storybookId, chapterInstanceId, { notice: "lock_updated", slotId }));
  }

  async function replaceSlotAction(formData: FormData) {
    "use server";
    const currentUser = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) redirect("/app/onboarding");

    const slotId = String(formData.get("slotId") ?? "");
    const candidate = parseCandidateJson(formData.get("candidateJson"));
    if (!illustrationId || !slotId || !candidate) {
      redirect(routeUrl(storybookId, chapterInstanceId, { error: "REPLACE_FAILED" }));
    }

    const cached = await cacheIllustrationAssetsForUser(currentUser.id, [candidate]);
    if (!cached.ok || !cached.data.ok || cached.data.assets.length === 0) {
      redirect(routeUrl(storybookId, chapterInstanceId, { error: "REPLACE_FAILED" }));
    }
    const cachedRow = cached.data.assets[0];
    const replaced = await replaceIllustrationSlotAssignmentForUser(currentUser.id, {
      illustrationId,
      slotId,
      mediaAssetId: cachedRow.mediaAssetId,
      providerMetaSnapshot: {
        provider: candidate.provider,
        sourceId: candidate.id,
        query: candidate.query ?? null,
        authorName: candidate.authorName,
        authorUrl: candidate.authorUrl ?? null,
        assetUrl: candidate.assetUrl ?? null,
        licenseUrl: candidate.licenseUrl ?? null,
        cacheMode: cachedRow.cacheMode
      }
    });
    if (!replaced.ok) {
      redirect(routeUrl(storybookId, chapterInstanceId, { error: "REPLACE_FAILED" }));
    }
    redirect(routeUrl(storybookId, chapterInstanceId, { notice: "replaced", slotId }));
  }

  const replaceSlot = getSearchString(resolvedSearchParams, "replaceSlot");
  const replaceQ = (getSearchString(resolvedSearchParams, "q") ?? "").trim();
  const replaceProvider = (getSearchString(resolvedSearchParams, "provider") ?? "both") as "unsplash" | "pexels" | "both";
  const replaceTarget = illustration?.slotTargets.find((slot) => slot.slotId === replaceSlot) ?? null;

  let replaceResults: ProviderAssetCandidate[] = [];
  let replaceSearchFailed = false;
  if (replaceSlot && replaceQ && replaceTarget) {
    const fetched = await fetchIllustrationCandidatesForUser(user.id, {
      provider: replaceProvider,
      queries: [replaceQ],
      orientation: replaceTarget.orientation,
      minShortSidePx: replaceTarget.minShortSidePx,
      perPage: 18
    });
    if (fetched.ok && fetched.data.ok) replaceResults = fetched.data.candidates;
    else replaceSearchFailed = true;
  }

  const errorCode = getSearchString(resolvedSearchParams, "error");
  const notice = getSearchString(resolvedSearchParams, "notice");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <ViewportEvent eventName="illustrations_review_view" eventProps={{ chapterKey: chapter.chapterKey }} />
      {notice === "generated" || notice === "regenerated" ? (
        <ViewportEvent
          eventName="auto_illustrate_success"
          eventProps={{ chapterKey: chapter.chapterKey, version: Number(getSearchString(resolvedSearchParams, "version") ?? "0") }}
        />
      ) : null}
      {errorCode ? (
        <ViewportEvent eventName="auto_illustrate_error" eventProps={{ chapterKey: chapter.chapterKey, error_code: errorCode }} />
      ) : null}

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gold/75">Auto-Illustrate Review</p>
            <h1 className="mt-2 font-display text-3xl text-parchment sm:text-4xl">{chapter.title}</h1>
            <p className="mt-2 text-sm text-white/70">
              {storybook.data.title} / {chapter.chapterKey}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-white/15 bg-white/[0.03] text-white/80">{chapter.status}</Badge>
            <ButtonLink href={`/book/${storybookId}/chapters/${chapterInstanceId}/draft`} variant="secondary">
              Back to Draft
            </ButtonLink>
          </div>
        </div>
      </Card>

      {!draft || draft.status !== "ready" ? (
        <Card className="p-5">
          <p className="text-sm text-amber-100">
            Chapter draft is not ready yet. Generate a chapter draft first in the Draft Review screen.
          </p>
          <div className="mt-3">
            <ButtonLink href={`/book/${storybookId}/chapters/${chapterInstanceId}/draft`} variant="secondary">
              Open Draft Review
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      {notice === "generated" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Auto-illustrate completed.</p></Card>
      ) : null}
      {notice === "regenerated" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Illustrations regenerated.</p></Card>
      ) : null}
      {notice === "replaced" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Slot replaced: {getSearchString(resolvedSearchParams, "slotId")}.</p></Card>
      ) : null}
      {notice === "lock_updated" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Lock updated for {getSearchString(resolvedSearchParams, "slotId")}.</p></Card>
      ) : null}
      {errorCode ? (
        <Card className="p-4"><p className="text-sm text-rose-100">{mapError(errorCode)}</p></Card>
      ) : null}
      {replaceSearchFailed ? (
        <Card className="p-4"><p className="text-sm text-rose-100">{mapError("SEARCH_FAILED")}</p></Card>
      ) : null}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-parchment">Illustration Actions</p>
            <p className="text-xs text-white/55">
              Auto-select high-resolution images for template slots, then lock or replace any slot.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={autoIllustrateAction}>
              <TrackedIllustrationActionButton
                type="submit"
                disabled={!draft || draft.status !== "ready"}
                eventName="auto_illustrate_start"
                eventProps={{ chapterKey: chapter.chapterKey }}
              >
                Auto-Illustrate
              </TrackedIllustrationActionButton>
            </form>
            <form action={regenerateAction}>
              <TrackedIllustrationActionButton
                type="submit"
                variant="secondary"
                disabled={!draft || draft.status !== "ready"}
                eventName="illustration_regenerate"
                eventProps={{ chapterKey: chapter.chapterKey }}
              >
                Regenerate All
              </TrackedIllustrationActionButton>
            </form>
          </div>
        </div>
      </Card>

      {illustration ? (
        <Card className="p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Theme Queries</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {illustration.theme.queries.map((query) => (
              <span key={query} className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/70">
                {query}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {replaceSlot && replaceTarget ? (
        <ReplaceImagePicker
          slotId={replaceSlot}
          query={replaceQ || illustration?.theme.queries[0] || chapter.title}
          provider={replaceProvider}
          results={replaceResults}
          minShortSidePx={replaceTarget.minShortSidePx}
          orientation={replaceTarget.orientation}
          searchActionUrl={routeUrl(storybookId, chapterInstanceId)}
          onReplace={replaceSlotAction}
        />
      ) : null}

      {!illustration ? (
        <Card className="p-6">
          <p className="text-sm text-white/70">No illustration set yet. Run Auto-Illustrate to create slot assignments.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {illustration.slotTargets.map((slot) => (
            <SlotCard
              key={slot.slotId}
              slot={slot}
              filled={(slotMap?.slots?.[slot.slotId] as any) ?? null}
              isLocked={illustration.lockedSlotIds.includes(slot.slotId)}
              onToggleLock={toggleLockAction}
              replaceHref={routeUrl(storybookId, chapterInstanceId, {
                replaceSlot: slot.slotId,
                q: replaceQ || illustration.theme.queries[0] || chapter.title,
                provider: replaceProvider
              })}
              analytics={{ chapterKey: chapter.chapterKey, slotId: slot.slotId }}
            />
          ))}
        </div>
      )}

      <Card className="p-4 sm:p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Illustration Versions</p>
        <div className="mt-3 space-y-2">
          {(versionList.length > 0 ? versionList : illustration ? [illustration] : []).map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
              <div>
                <p className="text-sm text-white/80">v{row.version}</p>
                <p className="text-xs text-white/50">{row.status}</p>
              </div>
              <p className="text-xs text-white/45">{new Date(row.updatedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
