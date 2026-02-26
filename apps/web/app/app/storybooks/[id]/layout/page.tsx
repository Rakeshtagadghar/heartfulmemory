import { redirect } from "next/navigation";
import { Card } from "../../../../../components/ui/card";
import { Editor2Shell } from "../../../../../components/editor2/EditorShell";
import { ChapterNavigator } from "../../../../../components/studio/ChapterNavigator";
import { ProceedNextChapterButton } from "../../../../../components/studio/ProceedNextChapterButton";
import { ViewportEvent } from "../../../../../components/viewport-event";
import { getOrCreateProfileForUser } from "../../../../../lib/profile";
import { requireAuthenticatedUser } from "../../../../../lib/auth/server";
import { getStorybookForUser } from "../../../../../lib/data/storybooks";
import { createDefaultCanvasForUser, listPagesByStorybookForUser } from "../../../../../lib/data/pages";
import { listFramesByStorybookForUser } from "../../../../../lib/data/frames";
import {
  getChapterStudioStateForUser,
  getLatestChapterDraftForUser,
  getLatestChapterIllustrationForUser,
  listChapterStudioStateByStorybookForUser,
  listGuidedChaptersByStorybookForUser,
  markChapterStudioEditedForUser,
  markChapterStudioFinalizedForUser
} from "../../../../../lib/data/create-flow";
import { getChapterNeighbors } from "../../../../../lib/chapters/navigation";
import { resolveNextChapterRoute } from "../../../../../lib/chapters/nextStepRouter";
import type { FrameDTO } from "../../../../../lib/dto/frame";

type Props = {
  params: Promise<{ id: string }>;
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

function chapterStudioStatusLabel(status: string | null | undefined): "Draft" | "Populated" | "Edited" | "Finalized" {
  if (status === "finalized") return "Finalized";
  if (status === "edited") return "Edited";
  if (status === "populated") return "Populated";
  return "Draft";
}

function parseIsoMs(value: string | null | undefined) {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export default async function StorybookLayoutPage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(`/app/storybooks/${id}/layout`);
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const storybook = await getStorybookForUser(user.id, id);
  if (!storybook.ok) {
    return (
      <Card className="p-6">
        <h1 className="font-display text-3xl text-parchment">Layout Studio unavailable</h1>
        <p className="mt-3 text-sm text-rose-100">{storybook.error}</p>
      </Card>
    );
  }

  let pages = await listPagesByStorybookForUser(user.id, id);
  if (pages.ok && pages.data.length === 0) {
    const seeded = await createDefaultCanvasForUser(user.id, id);
    if (seeded.ok) {
      pages = seeded;
    }
  }
  const frames = await listFramesByStorybookForUser(user.id, id);

  if (!pages.ok) {
    return (
      <Card className="p-6">
        <h1 className="font-display text-3xl text-parchment">Could not load pages</h1>
        <p className="mt-3 text-sm text-rose-100">{pages.error}</p>
      </Card>
    );
  }
  if (!frames.ok) {
    return (
      <Card className="p-6">
        <h1 className="font-display text-3xl text-parchment">Could not load frames</h1>
        <p className="mt-3 text-sm text-rose-100">{frames.error}</p>
      </Card>
    );
  }

  const framesByPageId: Record<string, FrameDTO[]> = {};
  for (const page of pages.data) {
    framesByPageId[page.id] = [];
  }
  for (const frame of frames.data) {
    let pageFrames = framesByPageId[frame.page_id];
    if (!pageFrames) {
      pageFrames = [];
      framesByPageId[frame.page_id] = pageFrames;
    }
    pageFrames.push(frame);
  }

  const chapterQuery = getSearchString(resolvedSearchParams, "chapter");
  const guidedChapterQuery = getSearchString(resolvedSearchParams, "guidedChapter");
  const activeChapterId = chapterQuery ?? guidedChapterQuery ?? null;
  const requestedPageId = getSearchString(resolvedSearchParams, "page");

  let chapterContext: {
    currentChapterId: string;
    chapterTitle: string;
    chapterKey: string;
    statusLabel: "Draft" | "Populated" | "Edited" | "Finalized";
    previousHref: string | null;
    previousChapterKey: string | null;
    nextHref: string | null;
    nextChapterKey: string | null;
    proceedHref: string | null;
    proceedLabel: string;
    canFinalize: boolean;
    chapterReadyEventProps: { chapterId: string; chapterKey: string; populate: number } | null;
    finalizeAction?: (formData: FormData) => Promise<void>;
  } | null = null;

  if (activeChapterId) {
    const [guidedChaptersResult, chapterStateListResult] = await Promise.all([
      listGuidedChaptersByStorybookForUser(user.id, id),
      listChapterStudioStateByStorybookForUser(user.id, id)
    ]);

    if (guidedChaptersResult.ok) {
      const guidedChapters = guidedChaptersResult.data;
      const neighbors = getChapterNeighbors(guidedChapters, activeChapterId);
      const chapterStates = chapterStateListResult.ok ? chapterStateListResult.data : [];
      const stateByChapterId = new Map(chapterStates.map((state) => [state.chapterInstanceId, state] as const));

      if (neighbors) {
        const currentNeighbor = neighbors.current;
        let currentState = stateByChapterId.get(neighbors.current.id) ?? null;
        if (currentState && currentState.status === "populated" && currentState.pageIds.length > 0) {
          const chapterPageIdSet = new Set(currentState.pageIds);
          let latestPageOrFrameUpdateMs = 0;
          for (const page of pages.data) {
            if (!chapterPageIdSet.has(page.id)) continue;
            latestPageOrFrameUpdateMs = Math.max(latestPageOrFrameUpdateMs, parseIsoMs(page.updated_at));
          }
          for (const frame of frames.data) {
            if (!chapterPageIdSet.has(frame.page_id)) continue;
            latestPageOrFrameUpdateMs = Math.max(latestPageOrFrameUpdateMs, parseIsoMs(frame.updated_at));
          }
          if (latestPageOrFrameUpdateMs > currentState.updatedAt) {
            const marked = await markChapterStudioEditedForUser(user.id, {
              storybookId: id,
              chapterInstanceId: neighbors.current.id
            });
            if (marked.ok) {
              currentState = marked.data.state;
            }
          }
        }

        const [prevDraft, prevIllustrations, prevState, nextDraft, nextIllustrations, nextState] = await Promise.all([
          neighbors.previous ? getLatestChapterDraftForUser(user.id, neighbors.previous.id) : Promise.resolve({ ok: true as const, data: null }),
          neighbors.previous ? getLatestChapterIllustrationForUser(user.id, neighbors.previous.id) : Promise.resolve({ ok: true as const, data: null }),
          neighbors.previous ? getChapterStudioStateForUser(user.id, neighbors.previous.id) : Promise.resolve({ ok: true as const, data: null }),
          neighbors.next ? getLatestChapterDraftForUser(user.id, neighbors.next.id) : Promise.resolve({ ok: true as const, data: null }),
          neighbors.next ? getLatestChapterIllustrationForUser(user.id, neighbors.next.id) : Promise.resolve({ ok: true as const, data: null }),
          neighbors.next ? getChapterStudioStateForUser(user.id, neighbors.next.id) : Promise.resolve({ ok: true as const, data: null })
        ]);

        const prevRoute = neighbors.previous
          ? resolveNextChapterRoute({
              storybookId: id,
              chapter: neighbors.previous,
              latestDraft: prevDraft.ok ? prevDraft.data : null,
              latestIllustration: prevIllustrations.ok ? prevIllustrations.data : null,
              studioState: prevState.ok ? prevState.data : null
            })
          : null;

        const nextRoute = neighbors.next
          ? resolveNextChapterRoute({
              storybookId: id,
              chapter: neighbors.next,
              latestDraft: nextDraft.ok ? nextDraft.data : null,
              latestIllustration: nextIllustrations.ok ? nextIllustrations.data : null,
              studioState: nextState.ok ? nextState.data : null
            })
          : null;

        async function finalizeChapterInStudio() {
          "use server";
          const currentUser = await requireAuthenticatedUser(`/app/storybooks/${id}/layout`);
          const currentProfile = await getOrCreateProfileForUser(currentUser);
          if (!currentProfile.onboarding_completed) redirect("/app/onboarding");
          await markChapterStudioFinalizedForUser(currentUser.id, {
            storybookId: id,
            chapterInstanceId: currentNeighbor.id
          });
          const qs = new URLSearchParams();
          qs.set("chapter", currentNeighbor.id);
          qs.set("guidedChapter", currentNeighbor.id);
          if (requestedPageId) qs.set("page", requestedPageId);
          qs.set("finalized", "1");
          redirect(`/app/storybooks/${id}/layout?${qs.toString()}`);
        }

        chapterContext = {
          currentChapterId: currentNeighbor.id,
          chapterTitle: currentNeighbor.title,
          chapterKey: currentNeighbor.chapterKey,
          statusLabel: chapterStudioStatusLabel(currentState?.status),
          previousHref: prevRoute?.href ?? null,
          previousChapterKey: neighbors.previous?.chapterKey ?? null,
          nextHref: nextRoute?.href ?? null,
          nextChapterKey: neighbors.next?.chapterKey ?? null,
          proceedHref: nextRoute?.href ?? null,
          proceedLabel: neighbors.next ? "Proceed to Next Chapter" : "Back to Chapters",
          canFinalize: chapterStudioStatusLabel(currentState?.status) !== "Finalized",
          chapterReadyEventProps:
            getSearchString(resolvedSearchParams, "chapterReady") === neighbors.current.id
              ? {
                  chapterId: currentNeighbor.id,
                  chapterKey: currentNeighbor.chapterKey,
                  populate: getSearchString(resolvedSearchParams, "populate") === "1" ? 1 : 0
                }
              : null,
          finalizeAction: finalizeChapterInStudio
        };
      }
    }
  }

  return (
    <div className="space-y-4">
      {chapterContext ? (
        <>
          <ViewportEvent eventName="populate_chapter_success" eventProps={chapterContext.chapterReadyEventProps ?? undefined} once />
          <ChapterNavigator
            title={chapterContext.chapterTitle}
            chapterKey={chapterContext.chapterKey}
            statusLabel={chapterContext.statusLabel}
            previous={
              chapterContext.previousHref && chapterContext.previousChapterKey
                ? { href: chapterContext.previousHref, chapterKey: chapterContext.previousChapterKey, label: "Prev" }
                : null
            }
            next={
              chapterContext.nextHref && chapterContext.nextChapterKey
                ? { href: chapterContext.nextHref, chapterKey: chapterContext.nextChapterKey, label: "Next" }
                : null
            }
            onFinalize={chapterContext.finalizeAction}
            canFinalize={chapterContext.canFinalize}
          />
          <Card className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-white/60">
                Sprint 21 chapter pipeline routing is active for this Studio session.
              </p>
              <ProceedNextChapterButton
                href={chapterContext.proceedHref ?? `/book/${id}/chapters`}
                label={chapterContext.proceedLabel}
              />
            </div>
          </Card>
          {getSearchString(resolvedSearchParams, "finalized") === "1" ? (
            <Card className="p-3">
              <p className="text-sm text-emerald-100">Chapter marked as laid out.</p>
            </Card>
          ) : null}
        </>
      ) : null}
      <Editor2Shell
        storybook={storybook.data}
        initialPages={pages.data}
        initialFramesByPageId={framesByPageId}
        initialSelectedPageId={
          requestedPageId && pages.data.some((page) => page.id === requestedPageId) ? requestedPageId : null
        }
        fullscreen
      />
    </div>
  );
}
