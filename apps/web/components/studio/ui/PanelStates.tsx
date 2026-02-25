"use client";

import type { ReactNode } from "react";
import { Button } from "../../ui/button";

export function PanelSkeletonGrid({ items = 4 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={`panel-skeleton-${index}`} className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="aspect-[4/3] rounded-lg bg-white/10" />
          <div className="mt-3 h-3 w-2/3 rounded bg-white/10" />
          <div className="mt-2 h-3 w-1/3 rounded bg-white/10" />
          <div className="mt-3 h-8 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function PanelEmptyState({
  title,
  description,
  actionLabel,
  onAction
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-4 text-xs text-white/55">
      <p className="font-semibold text-white/75">{title}</p>
      <p className="mt-1 leading-5">{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function PanelErrorState({
  message,
  onRetry,
  extra
}: {
  message: string;
  onRetry?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-rose-300/15 bg-rose-500/5 px-3 py-2 text-xs text-rose-100">
      <p>{message}</p>
      {extra ? <div className="mt-2">{extra}</div> : null}
      {onRetry ? (
        <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
