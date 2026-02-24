import { redirect } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { requireAuthenticatedUser } from "../../../lib/auth/server";
import { StartStorybookForm } from "../../../components/storybooks/start-storybook-form";
import { starterTemplatesV1 } from "../../../content/templates/starter-templates-v1";
import { createStorybookForUser } from "../../../lib/data/storybooks";
import { applyStarterTemplateForUser } from "../../../lib/templates/applyTemplate";

type StartActionState = { error: string | null };
const starterTemplateIds: ReadonlySet<string> = new Set(starterTemplatesV1.map((template) => template.id));

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getStartOptions() {
  return [
    {
      id: "blank",
      kind: "blank" as const,
      label: "Start blank",
      desc: "Create an empty storybook and add chapters yourself."
    },
    ...starterTemplatesV1.map((template) => ({
      id: template.id,
      kind: "template" as const,
      label: `Use ${template.name}`,
      desc: `Create ${template.chapters.length} starter chapters with one text block in each.`,
      templateId: template.id
    })),
    {
      id: "gift",
      kind: "gift" as const,
      label: "Gift flow",
      desc: "Plan a gift storybook experience and storyteller invite flow."
    }
  ];
}

export default async function StartPage() {
  const user = await requireAuthenticatedUser("/app/start");
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  async function createFromChoice(_: StartActionState, formData: FormData): Promise<StartActionState> {
    "use server";

    const currentUser = await requireAuthenticatedUser("/app/start");
    const currentProfile = await getOrCreateProfileForUser(currentUser);
    if (!currentProfile.onboarding_completed) {
      redirect("/app/onboarding");
    }

    const kind = getFormString(formData, "kind");
    if (kind === "blank") {
      const created = await createStorybookForUser(currentUser.id, {
        title: "My Storybook",
        bookMode: "DIGITAL"
      });
      if (!created.ok) return { error: created.error };
      redirect(`/app/storybooks/${created.data.id}`);
    }

    if (kind === "template") {
      const templateId = getFormString(formData, "templateId");
      if (!starterTemplateIds.has(templateId)) {
        return { error: "Unknown template." };
      }
      const created = await applyStarterTemplateForUser(currentUser.id, templateId);
      if (!created.ok) return { error: created.error };
      redirect(`/app/storybooks/${created.data.storybookId}`);
    }

    return { error: "Invalid start option." };
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Create-first flow</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Choose how to start your first storybook</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          Sprint 4 creates real Convex storybooks with owner-first authorization. Blank starts create a draft book; templates create chapters and starter text blocks.
        </p>
      </Card>

      <StartStorybookForm options={getStartOptions()} action={createFromChoice} />
    </div>
  );
}
