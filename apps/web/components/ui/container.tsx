import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("mx-auto w-full max-w-7xl px-6 sm:px-8", className)}
    />
  );
}

