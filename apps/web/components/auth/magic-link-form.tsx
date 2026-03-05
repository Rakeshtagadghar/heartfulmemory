"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { cn } from "../ui/cn";
import { ContinueWithGoogleButton } from "./ContinueWithGoogleButton";
import {
  trackAuthLoginSuccess,
  trackAuthMagicLinkRequested,
  trackAuthViewLogin
} from "../../lib/analytics/events_auth";
import { buildGoogleChooserPath, buildPostLoginPath } from "../../lib/auth/googleOAuthParams";

type Props = {
  returnTo: string;
  configMissing?: boolean;
  initialMessage?: string | null;
  initialMagicToken?: string | null;
  allowGoogle?: boolean;
};

function toSafeRedirectTarget(target: string | null | undefined, fallback: string) {
  if (!target) return fallback;

  try {
    const url = new URL(target, globalThis.location.origin);
    if (url.origin !== globalThis.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return target.startsWith("/") ? target : fallback;
  }
}

async function hasActiveSession() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
      headers: { accept: "application/json" }
    });
    if (!response.ok) return false;
    const session = (await response.json()) as { user?: { id?: string } | null } | null;
    return Boolean(session?.user?.id);
  } catch {
    return false;
  }
}

export function MagicLinkForm({
  returnTo,
  configMissing = false,
  initialMessage,
  initialMagicToken,
  allowGoogle = false
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingMethod, setPendingMethod] = useState<"email" | "password" | "google" | "token" | null>(null);
  const consumedInitialToken = useRef(false);

  useEffect(() => {
    trackAuthViewLogin({ returnTo });
  }, [returnTo]);

  useEffect(() => {
    if (!initialMagicToken || consumedInitialToken.current) return;
    consumedInitialToken.current = true;

    const run = async () => {
      setStatus("sending");
      setPendingMethod("token");
      setError(null);

      const result = await signIn("credentials", {
        magicToken: initialMagicToken,
        redirect: false,
        callbackUrl: returnTo
      });

      if (!result || result.error) {
        setStatus("error");
        setPendingMethod(null);
        setError("This sign-in link is invalid or expired. Please request a new one.");
        return;
      }

      trackAuthLoginSuccess({ source: "email_link" });
      setStatus("sent");
      setPendingMethod(null);
      const target = buildPostLoginPath(toSafeRedirectTarget(returnTo, "/app"));
      const sessionReady = await hasActiveSession();
      if (!sessionReady) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        await hasActiveSession();
      }
      globalThis.location.assign(target);
    };

    void run();
  }, [initialMagicToken, returnTo]);

  const helperMessage = useMemo(() => {
    if (configMissing) {
      return "Convex/Auth.js environment is not fully configured yet. Login may work in local dev mode only.";
    }
    if (status === "sent") {
      if (pendingMethod === "email") {
        return "Check your email for your secure sign-in link.";
      }
      return "Signed in. Redirecting to your app workspace...";
    }
    return initialMessage;
  }, [configMissing, initialMessage, pendingMethod, status]);

  return (
    <Card className="relative overflow-hidden p-6 sm:p-7">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Sign in</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-parchment sm:text-5xl">
          Continue to Memorioso
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          Enter your email. If you already use a password, enter it below. Otherwise continue with secure email sign-in.
        </p>

        {helperMessage ? (
          <p
            className={cn(
              "mt-4 rounded-xl border px-3 py-2 text-sm",
              configMissing
                ? "border-[#ffb4a9]/30 bg-[#ffb4a9]/10 text-[#ffd4cd]"
                : "border-white/10 bg-black/15 text-white/75"
            )}
          >
            {helperMessage}
          </p>
        ) : null}

        <form
          className="mt-5 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!email) return;

            setStatus("sending");
            setError(null);

            if (password.trim()) {
              setPendingMethod("password");
              const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: returnTo
              });

              if (!result || result.error) {
                setStatus("error");
                setPendingMethod(null);
                setError("Could not sign you in. Check your password and try again.");
                return;
              }

              trackAuthLoginSuccess({ source: "password_form" });
              setStatus("sent");
              setPendingMethod(null);
              const target = buildPostLoginPath(toSafeRedirectTarget(returnTo, "/app"));
              const sessionReady = await hasActiveSession();
              if (!sessionReady) {
                await new Promise((resolve) => setTimeout(resolve, 150));
                await hasActiveSession();
              }
              globalThis.location.assign(target);
              return;
            }

            setPendingMethod("email");
            trackAuthMagicLinkRequested({ returnTo, source: "email_link_request" });
            const response = await fetch("/api/auth/email/sign-in/request", {
              method: "POST",
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify({
                email: email.trim(),
                returnTo
              })
            });

            const payload = (await response.json().catch(() => ({}))) as {
              ok?: boolean;
              message?: string;
              error?: string;
            };

            if (!response.ok) {
              setStatus("error");
              setPendingMethod(null);
              setError(payload.error || "Could not send sign-in link. Please try again.");
              return;
            }

            setStatus("sent");
            setPendingMethod("email");
          }}
        >
          <label htmlFor="login-email" className="sr-only">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
          />
          <label htmlFor="login-password" className="sr-only">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password (optional)"
              className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 pr-12 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex h-12 w-12 items-center justify-center text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {showPassword ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
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
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M2.8 12c.9-1.8 4-6 9.2-6s8.3 4.2 9.2 6c.2.4.2.7 0 1-.9 1.8-4 6-9.2 6s-8.3-4.2-9.2-6c-.2-.3-.2-.6 0-1Z"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12.5" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-end">
            <Link href="/auth/reset-password" className="text-xs text-white/70 underline underline-offset-2 hover:text-white">
              Set or forgot password?
            </Link>
          </div>
          <p className="text-xs text-white/55">
            First time setting a password after email sign-in? Use this link and choose a new password.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={status === "sending" && (pendingMethod === "email" || pendingMethod === "password")}
            className="w-full"
          >
            {password.trim() ? "Sign in with password" : "Send secure sign-in link"}
          </Button>
        </form>

        {allowGoogle ? (
          <div className="mt-3">
            <ContinueWithGoogleButton
              loading={status === "sending" && pendingMethod === "google"}
              onClick={() => {
                setPendingMethod("google");
                setStatus("sending");
                setError(null);
                globalThis.location.assign(buildGoogleChooserPath(toSafeRedirectTarget(returnTo, "/app")));
              }}
            />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-[#ffd4cd]">
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
