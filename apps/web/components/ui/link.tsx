import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export function TextLink({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        "underline-offset-4 transition hover:text-parchment hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        className
      )}
    />
  );
}

