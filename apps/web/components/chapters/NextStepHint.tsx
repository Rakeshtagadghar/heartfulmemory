export function NextStepHint({ hint }: { hint: string | null }) {
  if (!hint) return null;
  return (
    <p className="mt-1 text-xs text-white/55">{hint}</p>
  );
}
