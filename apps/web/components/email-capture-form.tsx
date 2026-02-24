"use client";

import { FormEvent, useState } from "react";
import { track } from "./analytics";

export function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;

    setStatus("submitting");
    setError(null);

    const searchParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();

    const payload = {
      email,
      website,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      utm_source: searchParams.get("utm_source") || undefined,
      utm_campaign: searchParams.get("utm_campaign") || undefined,
      utm_medium: searchParams.get("utm_medium") || undefined
    };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not join the waitlist.");
      }

      track("email_capture_submit", { section: "email_capture" });
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not join the waitlist. Please try again."
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <label htmlFor="website" className="sr-only">
        Website
      </label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className="h-12 flex-1 rounded-xl border border-white/15 bg-black/20 px-4 text-white placeholder:text-white/45 outline-none transition focus:border-gold/60"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="h-12 rounded-xl border border-gold/60 bg-gold px-5 font-semibold text-ink transition hover:bg-[#e3c17b] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "success"
            ? "You are in"
            : status === "submitting"
              ? "Joining..."
              : "Join the waitlist"}
        </button>
      </div>
      {status === "error" && error ? (
        <p className="text-xs text-[#ffb4a9]" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-white/55">
        By signing up, you agree to receive product updates. Unsubscribe anytime.
      </p>
    </form>
  );
}
