"use client";

import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { PasswordField } from "../ui/PasswordField";
import { SET_PASSWORD_SKIP_COOKIE } from "../../lib/config/setPasswordPolicy";

const weakPasswordBlocklist = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "letmein123"
]);

type Props = {
  returnTo: string;
  allowSkip: boolean;
  skipWindowMs: number;
};

function getValidationError(password: string, confirmPassword: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Password must include at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must include at least one number.";
  if (weakPasswordBlocklist.has(password.toLowerCase())) {
    return "This password is too common. Please choose another one.";
  }
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}

export function SetPasswordForm({ returnTo, allowSkip, skipWindowMs }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validationError = useMemo(
    () => getValidationError(newPassword, confirmPassword),
    [newPassword, confirmPassword]
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/account/set-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newPassword })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error || "Could not set password right now. Please try again.");
        return;
      }

      setSuccess(true);
      globalThis.location.assign(returnTo);
    } finally {
      setSubmitting(false);
    }
  }

  function onSkip() {
    if (!allowSkip) return;
    const maxAgeSeconds = Math.max(1, Math.floor(skipWindowMs / 1000));
    const skipUntilMs = Date.now() + skipWindowMs;
    document.cookie = `${SET_PASSWORD_SKIP_COOKIE}=${skipUntilMs}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
    globalThis.location.assign(returnTo);
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <PasswordField
        label="New password"
        autoComplete="new-password"
        required
        value={newPassword}
        onChange={setNewPassword}
        placeholder="New password"
      />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Confirm password"
      />
      <p className="text-xs text-white/60">Use 8+ characters with at least one letter and one number.</p>
      <Button type="submit" size="lg" loading={submitting} className="w-full">
        Set password
      </Button>
      {allowSkip ? (
        <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onSkip}>
          Skip for now
        </Button>
      ) : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-200">Password set. Redirecting...</p> : null}
    </form>
  );
}

