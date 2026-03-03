"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";

type Props = {
  initialToken?: string | null;
};

export function ResetPasswordVerifyForm({ initialToken }: Props) {
  const [token, setToken] = useState(initialToken || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(false);
        if (!token.trim()) {
          setError("Reset link is missing. Please request a new one.");
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        setSubmitting(true);
        try {
          const response = await fetch("/api/auth/password/reset/verify", {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              token: token.trim(),
              password
            })
          });
          const payload = (await response.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
          };

          if (!response.ok || !payload.ok) {
            setError(payload.error || "Could not reset your password. Please request a new link.");
            return;
          }
          setSuccess(true);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label htmlFor="reset-code" className="sr-only">
        Verification code
      </label>
      <input
        id="reset-code"
        type="text"
        required
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="Reset code"
        className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
      />
      <label htmlFor="new-password" className="sr-only">
        New password
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="New password"
        className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
      />
      <label htmlFor="confirm-password" className="sr-only">
        Confirm new password
      </label>
      <input
        id="confirm-password"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm new password"
        className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
      />

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        Set new password
      </Button>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-200">
          Password updated. You can now{" "}
          <Link href="/auth/sign-in" className="underline underline-offset-2">
            sign in
          </Link>
          .
        </p>
      ) : null}
    </form>
  );
}
