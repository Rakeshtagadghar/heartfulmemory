import Link from "next/link";
import type { ReactNode } from "react";
import type { ProfileRecord } from "../../lib/profile";
import { LogoutButton } from "./logout-button";

export function AppShell({ children, email, profile }: { children: ReactNode; email: string | null | undefined; profile: ProfileRecord | null; }) {
  const displayName = profile?.display_name || email || "Member";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(213,179,106,0.06),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(17,59,52,0.13),transparent_42%),linear-gradient(180deg,#0a1321_0%,#0b1423_40%,#09111d_100%)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08101d]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold/75">Memorioso App</p>
            <p className="text-sm text-white/70">{displayName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app" className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/[0.05] hover:text-white">Dashboard</Link>
            <Link href="/app/start" className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/[0.05] hover:text-white">Start</Link>
            <Link href="/app/templates" className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/[0.05] hover:text-white">Templates</Link>
            <Link href="/app/onboarding" className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/[0.05] hover:text-white">Onboarding</Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:grid-cols-[240px_1fr] sm:px-6">
        <aside className="hidden sm:block">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Workspace</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Storybooks (soon)</li>
              <li>Templates gallery</li>
              <li>Exports (soon)</li>
              <li>Family invites (soon)</li>
            </ul>
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
