import { redirect } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { requireAuthenticatedUser } from "../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { ensureStorybookDocForUser } from "../../../lib/studio/ensureStorybookDoc";

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
  const query = new URLSearchParams();
  if (chapter) {
    query.set("chapter", chapter);
    query.set("guidedChapter", chapter);
  }

  redirect(`/app/storybooks/${storybookId}/layout${query.toString() ? `?${query.toString()}` : ""}`);
}

