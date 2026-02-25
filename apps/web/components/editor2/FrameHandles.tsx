"use client";

export type ResizeHandle =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

const HANDLE_SPECS: Array<{
  id: ResizeHandle;
  className: string;
  cursorClass: string;
}> = [
  { id: "nw", className: "-left-2 -top-2", cursorClass: "cursor-nwse-resize" },
  { id: "n", className: "left-1/2 -top-2 -translate-x-1/2", cursorClass: "cursor-ns-resize" },
  { id: "ne", className: "-right-2 -top-2", cursorClass: "cursor-nesw-resize" },
  { id: "e", className: "-right-2 top-1/2 -translate-y-1/2", cursorClass: "cursor-ew-resize" },
  { id: "se", className: "-right-2 -bottom-2", cursorClass: "cursor-nwse-resize" },
  { id: "s", className: "left-1/2 -bottom-2 -translate-x-1/2", cursorClass: "cursor-ns-resize" },
  { id: "sw", className: "-left-2 -bottom-2", cursorClass: "cursor-nesw-resize" },
  { id: "w", className: "-left-2 top-1/2 -translate-y-1/2", cursorClass: "cursor-ew-resize" }
];

export function FrameHandles({
  visible,
  onResizeStart
}: {
  visible: boolean;
  onResizeStart: (handle: ResizeHandle, event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  if (!visible) return null;

  return (
    <>
      {HANDLE_SPECS.map((handle) => (
        <button
          key={handle.id}
          type="button"
          aria-label={`Resize frame (${handle.id})`}
          className={`absolute z-30 h-4 w-4 rounded-full border border-white/80 bg-violet-400 shadow-lg ${handle.cursorClass} ${handle.className}`}
          onPointerDown={(event) => onResizeStart(handle.id, event)}
        />
      ))}
    </>
  );
}
