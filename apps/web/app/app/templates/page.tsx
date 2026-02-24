import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { TemplatesGallery } from "../../../components/templates/templates-gallery";
import { starterTemplatesV1 } from "../../../content/templates/starter-templates-v1";
import { applyStarterTemplateForUser } from "../../../lib/templates/applyTemplate";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { requireAuthenticatedUser } from "../../../lib/auth/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getSearchString(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AppTemplatesPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireAuthenticatedUser("/app/templates");
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  async function applyTemplateAction(formData: FormData) {
    "use server";

    const currentUser = await requireAuthenticatedUser("/app/templates");
    const templateId = getFormString(formData, "templateId");
    const created = await applyStarterTemplateForUser(currentUser.id, templateId);
    if (!created.ok) {
      redirect(`/app/templates?error=${encodeURIComponent(created.error)}`);
    }

    redirect(
      `/app/storybooks/${created.data.storybookId}?created=1&source=templates_gallery&templateId=${encodeURIComponent(created.data.templateId)}&templateVersion=${created.data.templateVersion}`
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Templates</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Start from a guided story arc</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
          Choose a proven chapter structure and start writing immediately. Applying a template creates a new user-owned storybook, ordered chapters, and starter text blocks in Convex.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/app/start"
            className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white hover:bg-white/[0.06]"
          >
            Back to Start Flow
          </Link>
          <Link
            href="/app"
            className="inline-flex h-10 items-center rounded-xl border border-gold/65 bg-gold px-4 text-sm font-semibold text-ink"
          >
            Dashboard
          </Link>
        </div>
      </Card>

      {getSearchString(resolvedSearchParams, "error") ? (
        <Card className="border-rose-300/20 bg-rose-500/10 p-4">
          <p className="text-sm text-rose-100">{getSearchString(resolvedSearchParams, "error")}</p>
        </Card>
      ) : null}

      <TemplatesGallery templates={starterTemplatesV1} applyAction={applyTemplateAction} />
    </div>
  );
}
