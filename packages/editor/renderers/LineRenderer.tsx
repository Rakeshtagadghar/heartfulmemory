import { normalizeLineNodeStyleV1 } from "../nodes/lineNode";

export function LineRenderer({ style }: { style: Record<string, unknown> }) {
  const lineStyle = normalizeLineNodeStyleV1(style);
  return (
    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <line
        x1="0"
        y1="50"
        x2="100"
        y2="50"
        stroke={lineStyle.stroke}
        strokeWidth={Math.max(1, lineStyle.strokeWidth)}
        strokeDasharray={lineStyle.dash?.join(" ") || undefined}
        opacity={lineStyle.opacity}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
