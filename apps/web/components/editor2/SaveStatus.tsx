"use client";

import type { FrameSaveStatus } from "../../lib/editor2/autosaveFrames";

export function Editor2SaveStatus({
  status,
  error
}: {
  status: FrameSaveStatus;
  error?: string | null;
}) {
  if (status === "idle") return <span className="text-xs text-white/45">Idle</span>;
  if (status === "saving") return <span className="text-xs text-cyan-100">Saving...</span>;
  if (status === "saved") return <span className="text-xs text-emerald-200">Saved</span>;
  if (status === "conflict") return <span className="text-xs text-amber-200">Conflict</span>;
  return <span className="text-xs text-rose-200">{error || "Save failed"}</span>;
}
