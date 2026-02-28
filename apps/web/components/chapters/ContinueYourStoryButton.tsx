import { ButtonLink } from "../ui/button";
import { NextStepHint } from "./NextStepHint";

export function ContinueYourStoryButton({
  href,
  hint,
  disabled
}: {
  href: string | null;
  hint: string | null;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      {href ? (
        <ButtonLink href={href} variant="primary">
          Continue your story
        </ButtonLink>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-gold/30 px-5 text-sm font-semibold text-white/40"
        >
          {disabled ? "Preparing…" : "Continue your story"}
        </button>
      )}
      <NextStepHint hint={hint} />
    </div>
  );
}
