"use client";

import { useId, useState } from "react";
import { cn } from "./cn";

type PasswordFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: "current-password" | "new-password";
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  required = false,
  disabled = false,
  className
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        type={revealed ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || label}
        className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 pr-12 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => setRevealed((state) => !state)}
        aria-label={revealed ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex h-12 w-12 items-center justify-center text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {revealed ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 3l18 18" strokeLinecap="round" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" />
            <path
              d="M6.7 6.7C4.7 8 3.4 9.8 2.8 11c-.2.4-.2.7 0 1 .9 1.8 4 6 9.2 6 2.1 0 3.9-.7 5.4-1.7"
              strokeLinecap="round"
            />
            <path
              d="M9 4.5A11 11 0 0 1 12 4c5.2 0 8.3 4.2 9.2 6 .2.4.2.7 0 1a12 12 0 0 1-1.8 2.6"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path
              d="M2.8 12c.9-1.8 4-6 9.2-6s8.3 4.2 9.2 6c.2.4.2.7 0 1-.9 1.8-4 6-9.2 6s-8.3-4.2-9.2-6c-.2-.3-.2-.6 0-1Z"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12.5" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

