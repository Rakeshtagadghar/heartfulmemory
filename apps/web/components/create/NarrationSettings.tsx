import { Card } from "../ui/card";
import { NarrationSaveButton } from "./NarrationSaveButton";

type NarrationSettingsValue = {
  voice: "first_person" | "third_person";
  tense: "past" | "present";
  tone: "warm" | "formal" | "playful" | "poetic";
  length: "short" | "medium" | "long";
};

function asNarrationValue(value: Record<string, unknown> | null | undefined): NarrationSettingsValue {
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

function SelectField({
  name,
  label,
  defaultValue,
  options
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-gold/45"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#0f1116] text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function NarrationSettings({
  narration,
  action,
  title = "Narration Settings",
  subtitle = "Saved on this storybook for upcoming story generation sprints.",
  embedded = false,
  narrationSaved = false
}: {
  narration?: Record<string, unknown> | null;
  action: (formData: FormData) => Promise<void>;
  title?: string;
  subtitle?: string;
  embedded?: boolean;
  narrationSaved?: boolean;
}) {
  const current = asNarrationValue(narration);
  const content = (
    <form action={action} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">{title}</p>
          <p className="mt-1 text-sm text-white/70">{subtitle}</p>
        </div>
        <NarrationSaveButton saved={narrationSaved} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          name="voice"
          label="Voice"
          defaultValue={current.voice}
          options={[
            { value: "third_person", label: "Third person" },
            { value: "first_person", label: "First person" }
          ]}
        />
        <SelectField
          name="tense"
          label="Tense"
          defaultValue={current.tense}
          options={[
            { value: "past", label: "Past" },
            { value: "present", label: "Present" }
          ]}
        />
        <SelectField
          name="tone"
          label="Tone"
          defaultValue={current.tone}
          options={[
            { value: "warm", label: "Warm" },
            { value: "formal", label: "Formal" },
            { value: "playful", label: "Playful" },
            { value: "poetic", label: "Poetic" }
          ]}
        />
        <SelectField
          name="length"
          label="Length"
          defaultValue={current.length}
          options={[
            { value: "short", label: "Short" },
            { value: "medium", label: "Medium" },
            { value: "long", label: "Long" }
          ]}
        />
      </div>
    </form>
  );

  if (embedded) return content;
  return <Card className="p-4 sm:p-5">{content}</Card>;
}
