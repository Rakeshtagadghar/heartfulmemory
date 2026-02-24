import type { ReactNode } from "react";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_15%_10%,rgba(213,179,106,0.08),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(17,59,52,0.16),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(198,109,99,0.1),transparent_45%),linear-gradient(180deg,#0a1321_0%,#0b1423_40%,#09111d_100%)] px-6 py-10 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative mx-auto grid min-h-[80vh] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section>
          <p className="text-xs uppercase tracking-[0.22em] text-gold/80">Memorioso App</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] text-parchment sm:text-6xl">
            Sign in and start preserving your family stories.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/75">
            Secure sign-in, private by default, and a simple onboarding flow so you can create your first storybook draft quickly.
          </p>
        </section>
        <section>{children}</section>
      </div>
    </main>
  );
}
