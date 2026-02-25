"use client";

import { getAvailableStudioTools } from "../../../../../packages/editor/tools/toolRegistry";
import type { FrameDTO } from "../../../lib/dto/frame";
import { CropToolEntry } from "./tools/CropToolEntry";

export function ToolsPanel({
  selectedFrame,
  cropModeActive,
  textEditActive
}: {
  selectedFrame: FrameDTO | null;
  cropModeActive: boolean;
  textEditActive: boolean;
}) {
  const tools = getAvailableStudioTools({
    selectedFrameType: selectedFrame?.type ?? null,
    cropModeActive,
    textEditActive
  });

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Selection</p>
        <p className="mt-2 text-sm text-white/90">
          {selectedFrame ? `${selectedFrame.type} frame selected` : "No frame selected"}
        </p>
        <p className="mt-1 text-xs text-white/55">
          {selectedFrame
            ? "Tools below adapt to your current selection."
            : "Select a frame on the canvas to see contextual tools."}
        </p>
      </div>

      <div className="space-y-2">
        {(selectedFrame?.type === "IMAGE" || selectedFrame?.type === "FRAME") ? (
          <CropToolEntry active={cropModeActive} />
        ) : null}
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white/90">{tool.title}</p>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/55">
                {tool.group}
              </span>
            </div>
            <p className="mt-1 text-xs leading-4 text-white/55">{tool.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
