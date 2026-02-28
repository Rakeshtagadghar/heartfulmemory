import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../../../../../components/app/app-shell";
import { Card } from "../../../../../../components/ui/card";
import { ErrorBanner } from "../../../../../../components/ui/ErrorBanner";
import { Badge } from "../../../../../../components/ui/badge";
import { ButtonLink } from "../../../../../../components/ui/button";
import { ViewportEvent } from "../../../../../../components/viewport-event";
import { SlotCard } from "../../../../../../components/illustrations/SlotCard";
import { ReplaceImagePicker } from "../../../../../../components/illustrations/ReplaceImagePicker";
import { UploadImagePicker } from "../../../../../../components/illustrations/UploadImagePicker";
import { TrackedIllustrationActionButton } from "../../../../../../components/illustrations/TrackedIllustrationActionButton";
import { requireAuthenticatedUser } from "../../../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../../../lib/profile";
import { signR2GetObject } from "../../../../../../lib/r2/server";
import {
  autoIllustrateChapterForUser,
  createUploadedIllustrationMediaAssetForUser,
  cacheIllustrationAssetsForUser,
  fetchIllustrationCandidatesForUser,
  getChapterIllustrationSlotMapForUser,
  getGuidedStorybookByIdForUser,
  getLatestChapterDraftForUser,
  getLatestChapterIllustrationForUser,
  listUploadedIllustrationMediaAssetsForUser,
  listChapterIllustrationVersionsForUser,
  listGuidedChaptersByStorybookForUser,
  replaceIllustrationSlotAssignmentForUser,
  type ChapterIllustrationSlotMap,
  type ProviderAssetCandidate,
  toggleIllustrationSlotLockForUser
} from "../../../../../../lib/data/create-flow";
import { mapErrorCodeToUserMessage } from "../../../../../../../../lib/errors/userMessages";
import { captureAppWarning } from "../../../../../../../../lib/observability/capture";
import { createCorrelationId } from "../../../../../../../../lib/observability/correlation";

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
  const base = `/book/${storybookId}/chapters/${chapterInstanceId}/illustrations`;
  return query ? `${base}?${query}` : base;
}

function formDataString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
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
  return mapErrorCodeToUserMessage(code, "Something went wrong while loading illustrations.");
}

async function resolveUploadedImageSourceUrl(input: {
  sourceUrl: string;
  storageKey: string | null;
}) {
  const direct = input.sourceUrl.trim();
  if (direct.length > 0) return direct;
  if (!input.storageKey) return "";
  try {
    return await signR2GetObject({ key: input.storageKey, expiresInSeconds: 60 * 60 * 24 * 7 });
  } catch {
    return "";
  }
}

export default async function ChapterIllustrationsPage({ params, searchParams }: Props) { // NOSONAR
  const { storybookId, chapterInstanceId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) redirect("/app/onboarding");

  function renderInAppShell(content: ReactNode) {
    return (
      <AppShell email={user.email} profile={profile}>
        {content}
      </AppShell>
    );
  }

  const [storybook, chapters, latestDraft, latestIllustration, illustrationSlotMap, versions, uploadedMediaAssets] = await Promise.all([
    getGuidedStorybookByIdForUser(user.id, storybookId),
    listGuidedChaptersByStorybookForUser(user.id, storybookId),
    getLatestChapterDraftForUser(user.id, chapterInstanceId),
    getLatestChapterIllustrationForUser(user.id, chapterInstanceId),
    getChapterIllustrationSlotMapForUser(user.id, chapterInstanceId),
    listChapterIllustrationVersionsForUser(user.id, chapterInstanceId),
    listUploadedIllustrationMediaAssetsForUser(user.id, 40)
  ]);

  if (!storybook.ok || !chapters.ok) {
    let contextError: string | undefined;
    if (!storybook.ok) contextError = storybook.error;
    else if (!chapters.ok) contextError = chapters.error;
    return renderInAppShell(
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
    return renderInAppShell(
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <p className="text-sm text-rose-100">Chapter not found.</p>
        </Card>
      </div>
    );
  }
  const chapterKey = chapter.chapterKey;

  const draft = latestDraft.ok ? latestDraft.data : null;
  const illustration = latestIllustration.ok ? latestIllustration.data : null;
  const illustrationId = illustration?.id ?? null;
  const slotMap = illustrationSlotMap.ok ? illustrationSlotMap.data : null;
  const versionList = versions.ok ? versions.data : [];

  function buildIllustrationErrorRedirect(errorCode: string, extra?: Record<string, unknown>) {
    const errRef = createCorrelationId();
    captureAppWarning("Illustration action failed", {
      runtime: "server",
      flow: "illustrations_review",
      feature: "illustrations_review",
      code: errorCode,
      storybookId,
      chapterKey,
      chapterInstanceId,
      extra: extra
        ? {
          correlationId: errRef,
          ...extra
        }
        : {
          correlationId: errRef
        }
    });
    return routeUrl(storybookId, chapterInstanceId, { error: errorCode, errRef });
  }

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
    if (!result.ok) redirect(buildIllustrationErrorRedirect("AUTO_ILLUSTRATE_FAILED"));
    if (!result.data.ok) {
      redirect(
        buildIllustrationErrorRedirect(result.data.errorCode, {
          retryable: result.data.retryable ?? null
        })
      );
    }
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
    const slotId = formDataString(formData, "slotId");
    if (!illustrationId || !slotId) redirect(buildIllustrationErrorRedirect("LOCK_FAILED"));
    const result = await toggleIllustrationSlotLockForUser(currentUser.id, { illustrationId, slotId });
    if (!result.ok) redirect(buildIllustrationErrorRedirect("LOCK_FAILED", { slotId }));
    redirect(routeUrl(storybookId, chapterInstanceId, { notice: "lock_updated", slotId }));
  }

  async function replaceSlotAction(formData: FormData) {
    "use server";
    const currentUser = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) redirect("/app/onboarding");

    const slotId = formDataString(formData, "slotId");
    const candidate = parseCandidateJson(formData.get("candidateJson"));
    if (!illustrationId || !slotId || !candidate) {
      redirect(buildIllustrationErrorRedirect("REPLACE_FAILED", { slotId }));
    }

    const cached = await cacheIllustrationAssetsForUser(currentUser.id, [candidate]);
    if (!cached.ok || !cached.data.ok || cached.data.assets.length === 0) {
      redirect(buildIllustrationErrorRedirect("REPLACE_FAILED", { slotId }));
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
      redirect(buildIllustrationErrorRedirect("REPLACE_FAILED", { slotId }));
    }
    redirect(routeUrl(storybookId, chapterInstanceId, { notice: "replaced", slotId }));
  }

  async function uploadAndReplaceSlotAction(input: {
    slotId: string;
    sourceUrl: string;
    storageKey: string | null;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    fileName: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    "use server";
    const currentUser = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) {
      return { ok: false, error: "Please complete onboarding first." };
    }

    const resolvedSourceUrl = await resolveUploadedImageSourceUrl({
      sourceUrl: input.sourceUrl,
      storageKey: input.storageKey
    });

    if (!illustrationId || !input.slotId || !resolvedSourceUrl) {
      return { ok: false, error: mapError("UPLOAD_FAILED") ?? "Upload failed." };
    }

    const created = await createUploadedIllustrationMediaAssetForUser(currentUser.id, {
      sourceId: input.storageKey || null,
      cachedUrl: resolvedSourceUrl,
      thumbUrl: resolvedSourceUrl,
      width: Math.max(1, input.width ?? 1),
      height: Math.max(1, input.height ?? 1),
      mime: input.mimeType
    });
    if (!created.ok) return { ok: false, error: created.error || (mapError("UPLOAD_FAILED") ?? "Upload failed.") };

    const replaced = await replaceIllustrationSlotAssignmentForUser(currentUser.id, {
      illustrationId,
      slotId: input.slotId,
      mediaAssetId: created.data.mediaAssetId,
      providerMetaSnapshot: {
        provider: "upload",
        sourceId: input.storageKey ?? created.data.mediaAssetId,
        fileName: input.fileName,
        mime: input.mimeType,
        cacheMode: "user_upload"
      }
    });
    if (!replaced.ok) return { ok: false, error: replaced.error || (mapError("UPLOAD_FAILED") ?? "Upload failed.") };
    return { ok: true };
  }

  async function uploadOnlyAction(input: {
    sourceUrl: string;
    storageKey: string | null;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    fileName: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    "use server";
    const currentUser = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) {
      return { ok: false, error: "Please complete onboarding first." };
    }

    const resolvedSourceUrl = await resolveUploadedImageSourceUrl({
      sourceUrl: input.sourceUrl,
      storageKey: input.storageKey
    });

    if (!resolvedSourceUrl) return { ok: false, error: mapError("UPLOAD_FAILED") ?? "Upload failed." };

    const created = await createUploadedIllustrationMediaAssetForUser(currentUser.id, {
      sourceId: input.storageKey || null,
      cachedUrl: resolvedSourceUrl,
      thumbUrl: resolvedSourceUrl,
      width: Math.max(1, input.width ?? 1),
      height: Math.max(1, input.height ?? 1),
      mime: input.mimeType
    });
    if (!created.ok) return { ok: false, error: created.error || (mapError("UPLOAD_FAILED") ?? "Upload failed.") };
    return { ok: true };
  }

  async function useUploadedAssetAction(
    input: { slotId: string; mediaAssetId: string }
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    "use server";
    const currentUser = await requireAuthenticatedUser(routeUrl(storybookId, chapterInstanceId));
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) {
      return { ok: false, error: "Please complete onboarding first." };
    }

    if (!illustrationId || !input.slotId || !input.mediaAssetId) {
      return { ok: false, error: mapError("UPLOAD_FAILED") ?? "Upload failed." };
    }

    const uploads = await listUploadedIllustrationMediaAssetsForUser(currentUser.id, 200);
    if (!uploads.ok || !uploads.data.some((asset) => asset.id === input.mediaAssetId)) {
      return { ok: false, error: mapError("UPLOAD_NOT_FOUND") ?? "Upload failed." };
    }

    const replaced = await replaceIllustrationSlotAssignmentForUser(currentUser.id, {
      illustrationId,
      slotId: input.slotId,
      mediaAssetId: input.mediaAssetId,
      providerMetaSnapshot: {
        provider: "upload",
        sourceId: input.mediaAssetId,
        cacheMode: "user_upload_reuse"
      }
    });
    if (!replaced.ok) return { ok: false, error: replaced.error || (mapError("UPLOAD_FAILED") ?? "Upload failed.") };
    return { ok: true };
  }

  const replaceSlot = getSearchString(resolvedSearchParams, "replaceSlot");
  const replaceQ = (getSearchString(resolvedSearchParams, "q") ?? "").trim();
  const replaceProvider = (getSearchString(resolvedSearchParams, "provider") ?? "both") as "unsplash" | "pexels" | "both";
  const replaceTarget = illustration?.slotTargets.find((slot) => slot.slotId === replaceSlot) ?? null;
  const isDraftReady = draft?.status === "ready";
  const currentSlotMap: ChapterIllustrationSlotMap["slots"] = slotMap?.slots ?? {};
  const displayVersions = [...versionList];
  if (displayVersions.length === 0 && illustration) {
    displayVersions.push(illustration);
  }

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
  const errorRef = getSearchString(resolvedSearchParams, "errRef");
  const notice = getSearchString(resolvedSearchParams, "notice");

  return renderInAppShell(
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
            <ButtonLink href={`/book/${storybookId}/chapters/${chapterInstanceId}/review`} variant="secondary">
              Back to Draft
            </ButtonLink>
          </div>
        </div>
      </Card>

      {isDraftReady ? null : (
        <Card className="p-5">
          <p className="text-sm text-amber-100">
            Chapter draft is not ready yet. Generate a chapter draft first in the Draft Review screen.
          </p>
          <div className="mt-3">
            <ButtonLink href={`/book/${storybookId}/chapters/${chapterInstanceId}/review`} variant="secondary">
              Open Draft Review
            </ButtonLink>
          </div>
        </Card>
      )}

      {notice === "generated" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Auto-illustrate completed.</p></Card>
      ) : null}
      {notice === "regenerated" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Illustrations regenerated.</p></Card>
      ) : null}
      {notice === "replaced" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Slot replaced: {getSearchString(resolvedSearchParams, "slotId")}.</p></Card>
      ) : null}
      {notice === "uploaded_replaced" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Uploaded image applied to slot: {getSearchString(resolvedSearchParams, "slotId")}.</p></Card>
      ) : null}
      {notice === "uploaded_reused" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Your uploaded image has been applied to slot: {getSearchString(resolvedSearchParams, "slotId")}.</p></Card>
      ) : null}
      {notice === "uploaded_library" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Image uploaded. Use Replace on a slot to apply it.</p></Card>
      ) : null}
      {notice === "lock_updated" ? (
        <Card className="p-4"><p className="text-sm text-emerald-100">Lock updated for {getSearchString(resolvedSearchParams, "slotId")}.</p></Card>
      ) : null}
      {errorCode ? (
        <ErrorBanner
          title="Illustration action failed"
          message={mapError(errorCode) ?? "Something went wrong while loading illustrations."}
          referenceId={errorRef}
        />
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
                disabled={!isDraftReady}
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
                disabled={!isDraftReady}
                eventName="illustration_regenerate"
                eventProps={{ chapterKey: chapter.chapterKey }}
              >
                Regenerate All
              </TrackedIllustrationActionButton>
            </form>
          </div>
        </div>

        {replaceSlot ? null : (
          <UploadImagePicker
            storybookId={storybookId}
            uploadedAssets={uploadedMediaAssets.ok ? uploadedMediaAssets.data : []}
            onUploadOnly={uploadOnlyAction}
            title="Upload Your Photos"
            subtitle="Upload images now and apply them later using Replace on any slot."
            uploadLabel="Upload Image"
          />
        )}
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
          storybookId={storybookId}
          slotId={replaceSlot}
          query={replaceQ || illustration?.theme.queries[0] || chapter.title}
          provider={replaceProvider}
          results={replaceResults}
          uploadedAssets={uploadedMediaAssets.ok ? uploadedMediaAssets.data : []}
          minShortSidePx={replaceTarget.minShortSidePx}
          orientation={replaceTarget.orientation}
          searchActionUrl={routeUrl(storybookId, chapterInstanceId)}
          onReplace={replaceSlotAction}
          onUploadAndReplace={uploadAndReplaceSlotAction}
          onUseUploadedAsset={useUploadedAssetAction}
        />
      ) : null}

      {illustration ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {illustration.slotTargets.map((slot) => (
            <SlotCard
              key={slot.slotId}
              slot={slot}
              filled={currentSlotMap[slot.slotId] ?? null}
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
      ) : (
        <Card className="p-6">
          <p className="text-sm text-white/70">No illustration set yet. Run Auto-Illustrate to create slot assignments.</p>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Illustration Versions</p>
        <div className="mt-3 space-y-2">
          {displayVersions.map((row) => (
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
