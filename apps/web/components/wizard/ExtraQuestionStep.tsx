"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export function ExtraQuestionStep({
  storybookTitle,
  defaultText,
  saveAction,
  skipAction
}: {
  storybookTitle: string;
  defaultText?: string | null;
  saveAction: (text: string) => Promise<void>;
  skipAction: () => Promise<void>;
}) {
  const [text, setText] = useState(defaultText ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please write something or tap Skip for now.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveAction(trimmed);
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    setError(null);
    try {
      await skipAction();
    } catch {
      setError("Could not skip. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <Card className="p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">One more thing</p>
        <h1 className="mt-2 font-display text-2xl text-parchment sm:text-3xl">{storybookTitle}</h1>
      </Card>

      <Card className="p-5 sm:p-6">
        <label htmlFor="extra-answer" className="block text-base font-semibold text-parchment">
          Do you want to add any more information or memories?
        </label>
        <p className="mt-1 text-sm text-white/60">
          Anything that matters — even if it doesn&apos;t fit a specific question.
        </p>
        <textarea
          id="extra-answer"
          className="mt-4 w-full rounded-xl border border-white/15 bg-white/[0.03] p-3 text-sm text-parchment placeholder-white/30 focus:border-gold/50 focus:outline-none"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share anything you'd like included in your story…"
          disabled={saving}
        />
        {error ? (
          <p className="mt-2 text-sm text-rose-100">{error}</p>
        ) : null}
      </Card>

      <Card className="sticky bottom-3 z-10 p-4 backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleSkip}
            disabled={saving}
          >
            Skip for now
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save & Continue"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
