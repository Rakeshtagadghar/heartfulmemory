export function CitationsRow({
  citations,
  label = "Based on answers"
}: {
  citations: string[];
  label?: string;
}) {
  if (!citations || citations.length === 0) {
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
        {citations.join(", ")}
      </span>
    </p>
  );
}

