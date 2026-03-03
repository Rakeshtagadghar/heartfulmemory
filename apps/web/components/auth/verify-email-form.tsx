"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";

type Props = {
  initialToken?: string | null;
};

export function VerifyEmailForm({ initialToken }: Props) {
  const [token, setToken] = useState(initialToken || "");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!token.trim()) {
            setError("Verification link is missing. Request a new email below.");
            return;
          }
          setSubmitting(true);
          setMessage(null);
          setError(null);
          try {
            const response = await fetch("/api/auth/email/verify/confirm", {
              method: "POST",
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify({ token: token.trim() })
            });
            const payload = (await response.json().catch(() => ({}))) as {
              ok?: boolean;
              message?: string;
              error?: string;
            };

            if (!response.ok || !payload.ok) {
              setError(payload.error || "Could not verify this link. Request a new one.");
              return;
            }

            setMessage(payload.message || "Email verified. You can continue to sign in.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <label htmlFor="verify-code" className="sr-only">
          Verification code
        </label>
        <input
          id="verify-code"
          type="text"
          required
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Enter verification code"
          className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Verify email
        </Button>
      </form>

      <form
        className="space-y-3 rounded-xl border border-white/10 bg-black/15 p-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!email.trim()) {
            setError("Enter your email to request a new verification link.");
            return;
          }
          setResending(true);
          setError(null);
          try {
            const response = await fetch("/api/auth/email/verify/request", {
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
              setError(payload.error || "Could not send a new link right now.");
              return;
            }
            setMessage(payload.message || "If an account exists for this email, we sent a verification email.");
          } finally {
            setResending(false);
          }
        }}
      >
        <label htmlFor="verify-email-address" className="sr-only">
          Email address
        </label>
        <input
          id="verify-email-address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Need a new email? Enter address"
          className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
        />
        <Button type="submit" size="lg" loading={resending} variant="secondary" className="w-full">
          Send new verification email
        </Button>
      </form>

      {message ? (
        <p className="text-sm text-emerald-200">
          {message}{" "}
          <Link href="/auth/sign-in" className="underline underline-offset-2">
            Go to sign in
          </Link>
          .
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  );
}
