import { normalizeFrameNodeContentV1, normalizeFrameNodeStyleV1 } from "../nodes/frameNode";
import { getCropImagePresentation } from "../utils/cropMath";

export function ElementFrameRenderer({
  style,
  content,
  crop
}: {
  style: Record<string, unknown>;
  content: Record<string, unknown>;
  crop?: Record<string, unknown> | null;
}) {
  const nodeStyle = normalizeFrameNodeStyleV1(style);
  const nodeContent = normalizeFrameNodeContentV1(content);
  const imageSrc = nodeContent.imageRef?.sourceUrl || nodeContent.imageRef?.previewUrl || null;

  if (imageSrc) {
    const presentation = getCropImagePresentation(crop, { objectFit: "cover" });
    return (
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          border: `${nodeStyle.strokeWidth}px solid ${nodeStyle.stroke}`,
          borderRadius: `${nodeStyle.cornerRadius}px`,
          opacity: nodeStyle.opacity,
          background: nodeStyle.fill ?? "transparent"
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Frame content"
          className="h-full w-full"
          style={{
            objectFit: presentation.objectFit,
            ...presentation.style
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        background: nodeStyle.fill ?? "transparent",
        border: `${nodeStyle.strokeWidth}px solid ${nodeStyle.stroke}`,
        borderRadius: `${nodeStyle.cornerRadius}px`,
        opacity: nodeStyle.opacity
      }}
    >
      <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,#1f2633_1px,transparent_1px),linear-gradient(to_bottom,#1f2633_1px,transparent_1px)] [background-size:14px_14px]" />
      <div className="relative text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a4f36]">Frame</p>
        <p className="mt-2 text-sm text-[#4b4333]">{nodeContent.placeholderLabel ?? "Frame placeholder"}</p>
      </div>
    </div>
  );
}
