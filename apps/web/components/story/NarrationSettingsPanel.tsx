import { NarrationSettings } from "../create/NarrationSettings";

export function NarrationSettingsPanel({
  narration,
  action,
  title = "Narration Settings",
  subtitle = "These settings are used for chapter draft generation.",
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
  return (
    <NarrationSettings
      narration={narration}
      action={action}
      title={title}
      subtitle={subtitle}
      embedded={embedded}
      narrationSaved={narrationSaved}
    />
  );
}
