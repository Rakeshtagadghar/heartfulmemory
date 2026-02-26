import { Card } from "../ui/card";
import { Button } from "../ui/button";

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
  action
}: {
  narration?: Record<string, unknown> | null;
  action: (formData: FormData) => Promise<void>;
}) {
  const current = asNarrationValue(narration);

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Narration Settings</p>
        <p className="mt-1 text-sm text-white/70">
          Saved on this storybook for upcoming story generation sprints.
        </p>
      </div>

      <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" variant="secondary">
            Save Narration Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}

