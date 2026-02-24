import { redirect } from "next/navigation";
import { Card } from "../../../../components/ui/card";
import { getOrCreateProfileForUser } from "../../../../lib/profile";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StorybookStubPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuthenticatedUser(`/app/storybooks/${id}`);
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  return (
    <Card className="p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Storybook Stub</p>
      <h1 className="mt-2 font-display text-4xl text-parchment">Storybook {id}</h1>
      <p className="mt-3 text-sm leading-7 text-white/70">
        Sprint 4 will load storybook rows, chapters, and blocks from Convex with owner checks enforced in server functions.
      </p>
    </Card>
  );
}
