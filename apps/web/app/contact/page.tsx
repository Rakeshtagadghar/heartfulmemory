import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../../lib/support/contact";

export const metadata: Metadata = {
  title: "Contact | Memorioso",
  description: "Contact Memorioso support for account, billing, and privacy requests."
};

export default function ContactPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 text-white">
      <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Support</p>
      <h1 className="mt-3 font-display text-4xl text-parchment sm:text-5xl">Contact Memorioso</h1>

      <div className="mt-6 space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/80">
        <p>
          For help with your account, billing, verification emails, or storybook access, contact us at:
        </p>

        <a
          href={SUPPORT_MAILTO}
          className="inline-flex rounded-xl border border-gold/50 bg-gold/10 px-4 py-2 text-base font-semibold text-gold transition hover:bg-gold/15"
        >
          {SUPPORT_EMAIL}
        </a>

        <div className="space-y-2">
          <p className="text-white/90">Common requests we handle:</p>
          <ul className="list-disc space-y-1 pl-6 text-white/75">
            <li>Password reset and sign-in issues</li>
            <li>Billing and subscription questions</li>
            <li>Data access and deletion requests</li>
            <li>General product support</li>
          </ul>
        </div>

        <p className="text-white/65">
          For legal details, review our{" "}
          <Link href="/privacy" className="text-gold hover:text-[#e8cc95]">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-gold hover:text-[#e8cc95]">
            Terms
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
