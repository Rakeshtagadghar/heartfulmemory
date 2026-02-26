export function CitationsRow({
  citations,
  label = "Based on answers"
}: {
  citations: string[];
  label?: string;
}) {
  const safeCitations = (citations ?? []).filter((citation) => /^q[_a-z0-9-]+$/i.test(citation));
  if (safeCitations.length === 0) {
    return (
      <p className="text-xs text-white/45">
        {label}: <span className="italic">uncertain / uncited</span>
      </p>
    );
  }

  return (
    <p className="text-xs text-white/55">
      {label}:{" "}
      <span className="font-medium text-white/75">
        {safeCitations.join(", ")}
      </span>
    </p>
  );
}
