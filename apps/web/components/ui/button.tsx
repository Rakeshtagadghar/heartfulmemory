import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-gold/65 bg-gold text-ink hover:bg-[#e3c17b] shadow-[0_10px_28px_rgba(213,179,106,0.18)]",
  secondary:
    "border border-white/20 bg-white/[0.03] text-white hover:border-gold/45 hover:bg-white/[0.06]",
  ghost:
    "border border-white/10 bg-transparent text-white hover:bg-white/[0.04] hover:border-white/20"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm"
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  loading = false,
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
    variantClasses[variant],
    sizeClasses[size],
    loading && "pointer-events-none opacity-70",
    className
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        buttonClassName({ variant, size, className }),
        "disabled:cursor-not-allowed disabled:opacity-70"
      )}
    >
      {leftIcon}
      <span>{loading ? "Loading..." : children}</span>
      {rightIcon}
    </button>
  );
}

type ButtonLinkProps = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
    className?: string;
  };

export function ButtonLink({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      aria-disabled={loading || undefined}
      className={buttonClassName({ variant, size, loading, className })}
    >
      {leftIcon}
      <span>{loading ? "Loading..." : children}</span>
      {rightIcon}
    </Link>
  );
}
