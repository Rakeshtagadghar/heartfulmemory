"use client";

import { useState } from "react";
import { Button } from "../ui/button";

export function ResetPasswordRequestForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!email.trim()) return;
        setSubmitting(true);
        setMessage(null);
        setError(null);
        try {
          const response = await fetch("/api/auth/password/reset/request", {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({ email: email.trim() })
          });
          const payload = (await response.json().catch(() => ({}))) as {
            ok?: boolean;
            message?: string;
            error?: string;
          };

          if (!response.ok) {
            setError(payload.error || "Could not send reset instructions. Please try again.");
            return;
          }

          setMessage(
            payload.message || "If an account exists for this email, we sent reset instructions."
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label htmlFor="reset-email" className="sr-only">
        Email address
      </label>
      <input
        id="reset-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
      />
      <Button type="submit" size="lg" loading={submitting} className="w-full">
        Send reset link
      </Button>
      {message ? <p className="text-sm text-white/75">{message}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </form>
  );
}
