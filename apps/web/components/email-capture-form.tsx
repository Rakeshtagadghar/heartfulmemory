"use client";

import { FormEvent, useState } from "react";
import { track } from "./analytics";

export function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    track("email_capture_submit", { section: "email_capture" });
    setSubmitted(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
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
          className="h-12 rounded-xl border border-gold/60 bg-gold px-5 font-semibold text-ink transition hover:bg-[#e3c17b]"
        >
          {submitted ? "You are in" : "Join the waitlist"}
        </button>
      </div>
      <p className="text-xs text-white/55">
        By signing up, you agree to receive product updates. Unsubscribe anytime.
      </p>
    </form>
  );
}
