import { redirect } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { ViewportEvent } from "../../../components/viewport-event";
import { requireAuthenticatedUser } from "../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { ensureStorybookDocForUser } from "../../../lib/studio/ensureStorybookDoc";
import { resolveOpenInStudioForUser } from "../../../lib/studio/openInStudio";

type Props = {
  params: Promise<{ storybookId: string }>;
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

export default async function StudioAliasPage({ params, searchParams }: Props) {
  const { storybookId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser(`/studio/${storybookId}`);
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const ensured = await ensureStorybookDocForUser(user.id, storybookId);
  if (!ensured.ok) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <h1 className="font-display text-3xl text-parchment">Studio unavailable</h1>
          <p className="mt-3 text-sm text-rose-100">{ensured.error}</p>
        </Card>
      </div>
    );
  }

  const chapter = getSearchString(resolvedSearchParams, "chapter");
  const retry = getSearchString(resolvedSearchParams, "retry") === "1";

  if (chapter) {
    const openResult = await resolveOpenInStudioForUser(user.id, {
      storybookId,
      chapterInstanceId: chapter
    });
    if (!openResult.ok) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <Card className="p-6">
            <h1 className="font-display text-3xl text-parchment">Studio unavailable</h1>
            <p className="mt-3 text-sm text-rose-100">{openResult.error}</p>
            <div className="mt-4">
              <a
                href={`/studio/${storybookId}?chapter=${encodeURIComponent(chapter)}&retry=1`}
                className="inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/80 hover:bg-white/[0.03]"
              >
                Retry
              </a>
            </div>
          </Card>
        </div>
      );
    }

    if (!openResult.data.ok) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <ViewportEvent
            eventName="populate_chapter_error"
            eventProps={{ error_code: openResult.data.errorCode, chapterId: chapter }}
          />
          <Card className="p-6">
            <h1 className="font-display text-3xl text-parchment">Could not prepare chapter</h1>
            <p className="mt-3 text-sm text-rose-100">{openResult.data.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/studio/${storybookId}?chapter=${encodeURIComponent(chapter)}&retry=1`}
                className="inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/80 hover:bg-white/[0.03]"
              >
                Retry
              </a>
              <a
                href={`/book/${storybookId}/chapters`}
                className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/60 hover:bg-white/[0.03]"
              >
                Back to Chapters
              </a>
            </div>
          </Card>
        </div>
      );
    }

    const openUrl = new URL(openResult.data.href, "http://local");
    const redirectUrl = new URL(`/app/storybooks/${storybookId}/layout`, "http://local");
    const chapterFromOpen = openUrl.searchParams.get("chapter");
    const pageFromOpen = openUrl.searchParams.get("page");
    if (chapterFromOpen) {
      redirectUrl.searchParams.set("chapter", chapterFromOpen);
      redirectUrl.searchParams.set("guidedChapter", chapterFromOpen);
    }
    if (pageFromOpen) {
      redirectUrl.searchParams.set("page", pageFromOpen);
    }
    if (openResult.data.populated || retry) {
      redirectUrl.searchParams.set("populate", openResult.data.populated ? "1" : "0");
      redirectUrl.searchParams.set("chapterReady", chapter);
    }
    redirect(redirectUrl.pathname + (redirectUrl.search ? redirectUrl.search : ""));
  }

  const query = new URLSearchParams();
  redirect(`/app/storybooks/${storybookId}/layout${query.toString() ? `?${query.toString()}` : ""}`);
}
