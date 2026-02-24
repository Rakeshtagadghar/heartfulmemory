import { MemoriosoLogo } from "../memorioso-logo";
import { EmailCaptureForm } from "../email-capture-form";

export function WaitlistSection() {
  return (
    <section id="email_capture" className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_12%_15%,rgba(213,179,106,0.12),transparent_44%),radial-gradient(circle_at_90%_25%,rgba(198,109,99,0.13),transparent_40%),radial-gradient(circle_at_80%_100%,rgba(17,59,52,0.2),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 shadow-panel sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="pointer-events-none absolute -left-10 top-8 h-28 w-28 rounded-full border border-gold/20 bg-gold/5 blur-xl" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="mb-4">
              <MemoriosoLogo compact />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold/90">Waitlist</p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-parchment sm:text-4xl">
              Get notified when QR and print upgrades launch
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              Join early to get roadmap updates and launch pricing when hardcover
              and scan-to-relive chapters become available.
            </p>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-black/10 p-4 backdrop-blur-sm">
            <EmailCaptureForm />
          </div>
        </div>
      </div>
    </section>
  );
}
