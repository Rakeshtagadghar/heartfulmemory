import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Chip({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-white/70",
        className
      )}
    />
  );
}

