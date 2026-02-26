import { Card } from "../ui/card";
import { NarrationSettings } from "../create/NarrationSettings";

type NarrationValue = {
  voice: "first_person" | "third_person";
  tense: "past" | "present";
  tone: "warm" | "formal" | "playful" | "poetic";
  length: "short" | "medium" | "long";
};

function asNarrationValue(value: Record<string, unknown> | null | undefined): NarrationValue {
  return {
    voice: value?.voice === "first_person" ? "first_person" : "third_person",
    tense: value?.tense === "present" ? "present" : "past",
    tone:
      value?.tone === "formal" || value?.tone === "playful" || value?.tone === "poetic"
        ? value.tone
        : "warm",
    length: value?.length === "short" || value?.length === "long" ? value.length : "medium"
  };
}

function previewLine(narration: NarrationValue) {
  const subject = narration.voice === "first_person" ? "I" : "She";
  const verb = narration.tense === "present" ? "walk" : "walked";
  const tone =
    narration.tone === "formal"
      ? "with quiet dignity"
      : narration.tone === "playful"
        ? "with a grin"
        : narration.tone === "poetic"
          ? "through the light of memory"
          : "with warmth";
  return `${subject} ${verb} back into that moment ${tone}. (${narration.length})`;
}

export function NarrationSettingsPanel({
  narration,
  action,
  title = "Narration Settings",
  subtitle = "These settings are used for chapter draft generation."
}: {
  narration?: Record<string, unknown> | null;
  action: (formData: FormData) => Promise<void>;
  title?: string;
  subtitle?: string;
}) {
  const current = asNarrationValue(narration);

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">{title}</p>
        <p className="mt-1 text-sm text-white/70">{subtitle}</p>
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/75">
          Preview: {previewLine(current)}
        </p>
      </Card>
      <NarrationSettings narration={narration} action={action} />
    </div>
  );
}
