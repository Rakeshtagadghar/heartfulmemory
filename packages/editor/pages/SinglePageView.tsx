"use client";

import type { ReactNode } from "react";
import { useScrollPageNavigation } from "./useScrollPageNavigation";

export function SinglePageView({
  pageCount,
  onPreviousPage,
  onNextPage,
  children
}: {
  pageCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  children: ReactNode;
}) {
  const wheelNavigation = useScrollPageNavigation({
    enabled: pageCount > 1,
    onNext: onNextPage,
    onPrevious: onPreviousPage
  });

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-[#d7d8dc]" {...wheelNavigation}>
      {children}
    </div>
  );
}
