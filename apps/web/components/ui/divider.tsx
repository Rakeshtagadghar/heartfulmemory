import { cn } from "./cn";

export function Divider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent",
        className
      )}
    />
  );
}

