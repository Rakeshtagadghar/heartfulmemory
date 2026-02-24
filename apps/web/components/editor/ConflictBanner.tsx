"use client";

import { Button } from "../ui/button";

export function ConflictBanner({
  message,
  onReload,
  onOverwrite
}: {
  message: string;
  onReload: () => void;
  onOverwrite: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-3">
      <p className="text-sm font-semibold text-amber-100">This block changed elsewhere</p>
      <p className="mt-1 text-xs text-amber-100/80">{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onReload}>
          Reload
        </Button>
        <Button type="button" size="sm" onClick={onOverwrite}>
          Overwrite
        </Button>
      </div>
    </div>
  );
}

