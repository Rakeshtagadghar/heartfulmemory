export default function ContactPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 text-white">
      <h1 className="font-display text-4xl text-parchment">Contact</h1>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm leading-7 text-white/80">
          Questions, feedback, or deletion requests:
        </p>
        <a
          href="mailto:hello@memorioso.example"
          className="mt-3 inline-flex rounded-xl border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/15"
        >
          hello@memorioso.example
        </a>
        <p className="mt-4 text-xs leading-6 text-white/55">
          Sprint 1 uses a simple contact stub. A richer support/contact workflow can be
          added in a later sprint.
        </p>
      </div>
    </main>
  );
}
