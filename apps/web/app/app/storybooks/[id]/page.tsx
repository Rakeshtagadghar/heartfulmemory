import { redirect } from "next/navigation";
import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { getOrCreateProfileForUser } from "../../../../lib/profile";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getStorybookForUser } from "../../../../lib/data/storybooks";
import { listChaptersByStorybookForUser } from "../../../../lib/data/chapters";
import { StorybookChaptersList } from "../../../../components/storybooks/storybook-chapters-list";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StorybookPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuthenticatedUser(`/app/storybooks/${id}`);
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const storybook = await getStorybookForUser(user.id, id);
  if (!storybook.ok) {
    return (
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Storybook</p>
        <h1 className="mt-2 font-display text-3xl text-parchment">Unable to load storybook</h1>
        <p className="mt-3 text-sm leading-7 text-rose-100">{storybook.error}</p>
      </Card>
    );
  }

  const chapters = await listChaptersByStorybookForUser(user.id, id);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Storybook</p>
            <h1 className="mt-2 font-display text-4xl text-parchment">{storybook.data.title}</h1>
            {storybook.data.subtitle ? (
              <p className="mt-2 text-sm text-white/70">{storybook.data.subtitle}</p>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-white/70">
              Sprint 4 validates persistence and ordering. Editor block editing lands in Sprint 5.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/15 bg-white/[0.03] text-white/80">{storybook.data.status}</Badge>
            <Badge className="border-white/15 bg-white/[0.03] text-white/80">{storybook.data.book_mode}</Badge>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-parchment">Chapters</h2>
          {chapters.ok ? <p className="text-sm text-white/55">{chapters.data.length} chapters</p> : null}
        </div>

        {chapters.ok ? (
          <StorybookChaptersList chapters={chapters.data} />
        ) : (
          <Card className="p-5">
            <p className="text-sm text-rose-100">Could not load chapters: {chapters.error}</p>
          </Card>
        )}
      </section>
    </div>
  );
}

