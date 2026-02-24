import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Section({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={cn("py-8 lg:py-10", className)}>
      {children}
    </section>
  );
}

export function SectionHeader({
  kicker,
  title,
  description,
  className
}: {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      {kicker ? (
        <p className="text-xs uppercase tracking-[0.2em] text-gold/90">{kicker}</p>
      ) : null}
      <h2 className="mt-2 font-display text-3xl leading-tight text-parchment sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{description}</p>
      ) : null}
    </div>
  );
}

