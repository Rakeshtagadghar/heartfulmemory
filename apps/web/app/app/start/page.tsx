import { redirect } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { requireAuthenticatedUser } from "../../../lib/auth/server";

const options = [
  {
    id: "blank",
    label: "Start blank",
    desc: "Create an empty storybook and add chapters yourself. (Convex-backed create lands in Sprint 4)"
  },
  {
    id: "template_childhood",
    label: "Use Childhood & Roots template",
    desc: "Start with a guided structure and prompts."
  },
  {
    id: "gift",
    label: "Gift flow",
    desc: "Set up a storyteller invite and plan a meaningful gift."
  }
] as const;

export default async function StartPage() {
  const user = await requireAuthenticatedUser("/app/start");
  const profile = await getOrCreateProfileForUser(user);

  if (!profile.onboarding_completed) {
    redirect("/app/onboarding");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Create-first flow</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Choose how to start your first storybook</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          Sprint 3.5 preserves the protected entrypoint while backend persistence moves to Convex. Sprint 4 will create real storybook documents from these choices.
        </p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {options.map((option) => (
          <Card key={option.id} className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Option</p>
            <h2 className="mt-2 text-lg font-semibold text-parchment">{option.label}</h2>
            <p className="mt-2 text-sm leading-7 text-white/70">{option.desc}</p>
            <button type="button" disabled className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white/70 disabled:cursor-not-allowed">
              Available in Sprint 4
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
