import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold",
        className
      )}
    />
  );
}

