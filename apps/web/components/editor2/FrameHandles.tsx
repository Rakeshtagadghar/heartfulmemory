"use client";

export function FrameHandles({
  visible,
  onResizeStart
}: {
  visible: boolean;
  onResizeStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Resize frame"
      className="absolute -bottom-2 -right-2 h-4 w-4 cursor-se-resize rounded-sm border border-white/70 bg-[#0f1727] shadow-lg"
      onPointerDown={onResizeStart}
    />
  );
}

