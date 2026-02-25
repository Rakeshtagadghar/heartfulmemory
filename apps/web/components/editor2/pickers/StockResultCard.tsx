"use client";
/* eslint-disable @next/next/no-img-element */

import type { NormalizedStockResult } from "../../../lib/stock/types";
import { Button } from "../../ui/button";
import { setDraggedMediaPayload } from "../../studio/dnd/frameDropTarget";

export function StockResultCard({
  result,
  onInsert,
  loading
}: {
  result: NormalizedStockResult;
  onInsert: (result: NormalizedStockResult) => void;
  loading?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div
        className="relative aspect-[4/3] cursor-grab bg-black/20 active:cursor-grabbing"
        draggable
        onDragStart={(event) => {
          setDraggedMediaPayload(event.dataTransfer, { kind: "stock", result });
          event.dataTransfer.effectAllowed = "copy";
        }}
      >
        <img
          src={result.thumbUrl}
          alt={`${result.provider} result`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white">
          {result.provider}
        </div>
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-1 text-xs text-white/70">{result.authorName}</p>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-md border border-white/15 bg-white/[0.03] px-2 py-1 text-white/75">
            {result.licenseName}
          </span>
          {result.requiresAttribution ? (
            <span className="rounded-md border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-amber-100">
              Attribution
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full"
          loading={loading}
          disabled={loading}
          onClick={() => onInsert(result)}
        >
          Insert
        </Button>
      </div>
    </div>
  );
}
