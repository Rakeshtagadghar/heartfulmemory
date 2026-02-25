import { normalizeShapeNodeContentV1, normalizeShapeNodeStyleV1 } from "../nodes/shapeNode";

export function ShapeRenderer({
  style,
  content
}: {
  style: Record<string, unknown>;
  content: Record<string, unknown>;
}) {
  const nodeStyle = normalizeShapeNodeStyleV1(style);
  const nodeContent = normalizeShapeNodeContentV1(content);
  const isCircle = nodeContent.shapeType === "circle";
  return (
    <div
      className="h-full w-full"
      style={{
        background: nodeStyle.fill,
        border: `${nodeStyle.strokeWidth}px solid ${nodeStyle.stroke}`,
        borderRadius: isCircle ? "999px" : `${nodeStyle.radius ?? 0}px`,
        opacity: nodeStyle.opacity
      }}
    />
  );
}
