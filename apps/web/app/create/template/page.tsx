import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "../../../components/app/app-shell";
import { Card } from "../../../components/ui/card";
import { ButtonLink } from "../../../components/ui/button";
import { TemplateCard } from "../../../components/create/TemplateCard";
import { ViewportEvent } from "../../../components/viewport-event";
import { requireAuthenticatedUser } from "../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { createClientRequestId } from "../../../lib/createFlow/clientRequestId";
import { createGuidedStorybookForUser, listActiveGuidedTemplates } from "../../../lib/data/create-flow";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export default async function CreateTemplatePage() {
  const user = await requireAuthenticatedUser("/create/template");
  const profile = await getOrCreateProfileForUser(user);
  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const templatesResult = await listActiveGuidedTemplates();

  async function startTemplateFlow(formData: FormData) {
    "use server";

    const currentUser = await requireAuthenticatedUser("/create/template");
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) {
      redirect("/app/onboarding");
    }

    const templateId = getFormValue(formData, "templateId");
    const clientRequestId = getFormValue(formData, "clientRequestId") || createClientRequestId("template");

    const created = await createGuidedStorybookForUser(currentUser.id, {
      templateId,
      clientRequestId
    });

    if (!created.ok) {
      redirect(`/create/template?error=${encodeURIComponent(created.error)}`);
    }

    redirect(`/book/${created.data.storybookId}/chapters`);
  }

  let templatesContent;
  if (templatesResult.ok) {
    if (templatesResult.data.length > 0) {
      templatesContent = (
        <div className="grid gap-5 lg:grid-cols-2">
          {templatesResult.data.map((template) => (
            <TemplateCard
              key={template.templateId}
              template={template}
              clientRequestId={createClientRequestId(`template_${template.templateId}`)}
              action={startTemplateFlow}
            />
          ))}
        </div>
      );
    } else {
      templatesContent = (
        <Card className="p-6">
          <p className="text-sm text-white/75">No active templates found yet.</p>
        </Card>
      );
    }
  } else {
    templatesContent = (
      <Card className="p-6">
        <p className="text-sm text-rose-100">Could not load templates: {templatesResult.error}</p>
      </Card>
    );
  }

  return (
    <AppShell email={user.email} profile={profile}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden p-6 sm:p-8">
          <ViewportEvent eventName="create_entry_view" />
          <ViewportEvent eventName="template_select_view" />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Guided story flow</p>
              <h1 className="mt-2 font-display text-3xl text-parchment sm:text-4xl">
                Choose a template to start your storybook
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                Pick a guided template with chapter prompts, or start without a template. Your progress will be saved chapter by chapter.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ButtonLink href="/create/freeform" variant="secondary" size="lg" className="justify-center">
                Start Without Template
              </ButtonLink>
              <Link
                href="/app/start"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/65 hover:bg-white/[0.03]"
              >
                Legacy Start Flow
              </Link>
            </div>
          </div>
        </Card>

        {templatesContent}
      </div>
    </AppShell>
  );
}
