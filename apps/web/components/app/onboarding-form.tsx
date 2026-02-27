"use client";

import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { trackOnboardingComplete, trackOnboardingView } from "../../lib/analytics/events_auth";
import type { OnboardingGoal } from "../../lib/profile";

type Props = {
  initialDisplayName?: string | null;
  initialGoal?: string | null;
};

const goals: Array<{ id: OnboardingGoal; label: string; desc: string }> = [
  {
    id: "create_storybook",
    label: "Create my storybook",
    desc: "I want to capture my own stories and memories."
  },
  {
    id: "gift_storybook",
    label: "Gift a storybook",
    desc: "I want to invite someone and help them preserve their stories."
  },
  {
    id: "capture_parent_stories",
    label: "Capture parent stories",
    desc: "I want to record and organize stories from a parent or grandparent."
  }
];

function getInitialGoal(initialGoal?: string | null): OnboardingGoal {
  const matchedGoal = goals.find((item) => item.id === initialGoal);
  return matchedGoal ? matchedGoal.id : "create_storybook";
}

export function OnboardingForm({ initialDisplayName, initialGoal }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [goal, setGoal] = useState<OnboardingGoal>(getInitialGoal(initialGoal));
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackOnboardingView();
  }, []);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName, goal, marketingConsent }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not save onboarding details.");
      }
      trackOnboardingComplete({ source: "onboarding", goal });
      router.push("/create/template");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Could not save onboarding details.",
      );
    }
  }

  return (
    <Card className="p-6 sm:p-7">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Onboarding</p>
          <h1 className="mt-2 font-display text-3xl text-parchment sm:text-4xl">Set up your workspace</h1>
          <p className="mt-2 text-sm text-white/70">A few details help us personalize your first storybook flow.</p>
        </div>

        <div>
          <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-white/90">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
            className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-white/90">What are you here to do first?</legend>
          <div className="space-y-2">
            {goals.map((item) => (
              <label
                key={item.id}
                aria-label={item.label}
                className="flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <input
                  type="radio"
                  name="goal"
                  value={item.id}
                  checked={goal === item.id}
                  onChange={() => setGoal(item.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-parchment">{item.label}</span>
                  <span className="mt-1 block text-xs leading-6 text-white/65">{item.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label
          aria-label="Marketing consent"
          className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/75"
        >
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) => setMarketingConsent(event.target.checked)}
            className="mt-1"
          />
          <span>
            I want product updates and launch notes for future features like QR playback and print upgrades.
          </span>
        </label>

        {error ? (
          <p role="alert" className="text-sm text-[#ffd4cd]">{error}</p>
        ) : null}

        <Button type="submit" size="lg" loading={status === "saving"} className="w-full">
          Complete onboarding
        </Button>
      </form>
    </Card>
  );
}
