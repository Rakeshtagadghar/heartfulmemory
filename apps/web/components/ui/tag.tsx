import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Tag({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/65",
        className
      )}
    />
  );
}

