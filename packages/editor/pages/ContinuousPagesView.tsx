"use client";

import type { ReactNode } from "react";

export function ContinuousPagesView({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-full overflow-auto bg-[#c7c8cd]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-6 py-6">
        {children}
      </div>
    </div>
  );
}
