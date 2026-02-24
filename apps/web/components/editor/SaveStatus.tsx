"use client";

import type { AutosaveStatus } from "../../lib/editor/autosave";

export function SaveStatus({
  status,
  error
}: {
  status: AutosaveStatus;
  error?: string | null;
}) {
  if (status === "idle") {
    return <p className="text-xs text-white/45">Idle</p>;
  }

  if (status === "saving") {
    return <p className="text-xs text-white/60">Saving...</p>;
  }

  if (status === "saved") {
    return <p className="text-xs text-emerald-200">Saved</p>;
  }

  if (status === "conflict") {
    return <p className="text-xs text-amber-200">Conflict detected</p>;
  }

  return <p className="text-xs text-rose-200">{error || "Save failed"}</p>;
}

