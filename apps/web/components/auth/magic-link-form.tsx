"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { cn } from "../ui/cn";
import {
  trackAuthLoginSuccess,
  trackAuthMagicLinkRequested,
  trackAuthViewLogin
} from "../../lib/analytics/events_auth";

type Props = {
  returnTo: string;
  configMissing?: boolean;
  initialMessage?: string | null;
};

export function MagicLinkForm({ returnTo, configMissing = false, initialMessage }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackAuthViewLogin({ returnTo });
  }, [returnTo]);

  const helperMessage = useMemo(() => {
    if (configMissing) {
      return "Convex/Auth.js environment is not fully configured yet. Login may work in local dev mode only.";
    }
    if (status === "sent") {
      return "Signed in. Redirecting to your app workspace...";
    }
    return initialMessage;
  }, [configMissing, initialMessage, status]);

  return (
    <Card className="relative overflow-hidden p-6 sm:p-7">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Sign in</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-parchment sm:text-5xl">
          Continue to Memorioso
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          Sprint 3.5 migrates auth to Auth.js + Convex. This build uses a developer email sign-in fallback until magic links are configured.
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
            trackAuthMagicLinkRequested({ returnTo, source: "login" });

            const result = await signIn("credentials", {
              email,
              redirect: false,
              callbackUrl: returnTo
            });

            if (!result || result.error) {
              setStatus("error");
              setError("Could not sign you in. Please try again.");
              return;
            }

            trackAuthLoginSuccess({ source: "login_form" });
            setStatus("sent");
            router.push(result.url || returnTo);
            router.refresh();
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
          <Button type="submit" size="lg" loading={status === "sending"} className="w-full">
            Continue to app
          </Button>
        </form>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-[#ffd4cd]">
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
