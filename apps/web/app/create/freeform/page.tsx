import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "../../../components/ui/card";
import { ViewportEvent } from "../../../components/viewport-event";
import { TrackedCreateSubmitButton } from "../../../components/create/TrackedCreateSubmitButton";
import { requireAuthenticatedUser } from "../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { createGuidedStorybookForUser } from "../../../lib/data/create-flow";
import { createClientRequestId } from "../../../lib/createFlow/clientRequestId";

export default async function CreateFreeformPage() {
  const user = await requireAuthenticatedUser("/create/freeform");
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  async function startFreeform(formData: FormData) {
    "use server";
    const currentUser = await requireAuthenticatedUser("/create/freeform");
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) {
      redirect("/app/onboarding");
    }

    const titleRaw = formData.get("title");
    const title = typeof titleRaw === "string" ? titleRaw : "";
    const clientRequestRaw = formData.get("clientRequestId");
    const clientRequestId =
      typeof clientRequestRaw === "string" && clientRequestRaw
        ? clientRequestRaw
        : createClientRequestId("freeform");

    const created = await createGuidedStorybookForUser(currentUser.id, {
      templateId: null,
      optionalTitle: title || null,
      clientRequestId
    });

    if (!created.ok) {
      redirect(`/create/freeform?error=${encodeURIComponent(created.error)}`);
    }

    redirect(`/book/${created.data.storybookId}/chapters`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Card className="p-6 sm:p-8">
        <ViewportEvent eventName="create_entry_view" />
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">No-template path</p>
        <h1 className="mt-2 font-display text-3xl text-parchment sm:text-4xl">Start without a template</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          This creates a guided-flow storybook with a default Chapter 1 so you can start capturing memories immediately. Additional freeform chapter tools can be added later.
        </p>

        <form action={startFreeform} className="mt-6 space-y-4">
          <input type="hidden" name="clientRequestId" value={createClientRequestId("freeform")} />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-white/85">Story title (optional)</span>
            <input
              type="text"
              name="title"
              placeholder="My Storybook"
              className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm text-white outline-none ring-0 placeholder:text-white/35 focus:border-gold/45"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <TrackedCreateSubmitButton type="submit" size="lg" className="justify-center" mode="freeform">
              Create Freeform Storybook
            </TrackedCreateSubmitButton>
            <Link
              href="/create/template"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/75 hover:bg-white/[0.03]"
            >
              Back to Templates
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
