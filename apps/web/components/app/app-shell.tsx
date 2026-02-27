 "use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { ProfileRecord } from "../../lib/profile";
import { trackAuthLogout } from "../../lib/analytics/events_auth";
import { MemoriosoLogo } from "../memorioso-logo";

function getDisplayLabel(profile: ProfileRecord | null, email: string | null | undefined, suppressFallback: boolean) {
  return profile?.display_name || email || (suppressFallback ? "" : "Member");
}

function initialsFromLabel(value: string) {
  const source = value.trim();
  if (!source) return "M";
  if (source.includes("@")) return source.slice(0, 1).toUpperCase();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function navLinkClass(active: boolean) {
  return [
    "rounded-lg px-3 py-2 text-sm transition",
    active ? "bg-white/[0.06] text-parchment" : "text-white/75 hover:bg-white/[0.05] hover:text-white"
  ].join(" ");
}

export function AppShell({
  children,
  email,
  profile,
  suppressDisplayNameFallback = false
}: {
  children: ReactNode;
  email: string | null | undefined;
  profile: ProfileRecord | null;
  suppressDisplayNameFallback?: boolean;
}) {
  const pathname = usePathname();
  const isLayoutStudio = pathname?.includes("/layout") ?? false;
  const displayName = getDisplayLabel(profile, email, suppressDisplayNameFallback);
  const dashboardActive = pathname === "/app";
  const templatesActive = (pathname?.startsWith("/create/template") ?? false) || (pathname?.startsWith("/app/templates") ?? false);
  const onboardingActive = pathname?.startsWith("/app/onboarding") ?? false;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarLabel = displayName || "Member";
  const avatarInitials = initialsFromLabel(avatarLabel);

  useEffect(() => {
    if (!userMenuOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!userMenuRef.current) return;
      if (userMenuRef.current.contains(event.target as Node)) return;
      setUserMenuOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setUserMenuOpen(false);
    }

    globalThis.addEventListener("pointerdown", onPointerDown);
    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      globalThis.removeEventListener("pointerdown", onPointerDown);
      globalThis.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(213,179,106,0.06),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(17,59,52,0.13),transparent_42%),linear-gradient(180deg,#0a1321_0%,#0b1423_40%,#09111d_100%)] text-white">
      {isLayoutStudio ? null : (
        <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] shadow-[0_12px_40px_rgba(4,10,20,0.35)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="pointer-events-none absolute left-8 top-0 h-px w-28 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              <div className="pointer-events-none absolute -right-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-gold/20 bg-gold/10 blur-xl" />

              <div className="relative mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
                <Link href="/app" className="rounded-xl transition hover:bg-white/[0.03]">
                  <MemoriosoLogo className="scale-[0.95] origin-left" />
                </Link>
                <div className="flex items-center gap-2">
                  <Link href="/app" className={navLinkClass(dashboardActive)}>Dashboard</Link>
                  <Link href="/create/template" className={navLinkClass(templatesActive)}>Templates</Link>
                  <Link href="/app/onboarding" className={navLinkClass(onboardingActive)}>Onboarding</Link>
                  <div ref={userMenuRef} className="relative ml-1">
                <button
                  type="button"
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                  onClick={() => setUserMenuOpen((current) => !current)}
                >
                  {avatarInitials}
                </button>
                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 overflow-hidden rounded-2xl border border-white/12 bg-[#0b1220]/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl"
                  >
                    <div className="mb-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                      <p className="truncate text-sm font-semibold text-white">{profile?.display_name || "Memorioso Member"}</p>
                      <p className="truncate text-xs text-white/55">{email ?? "Signed in"}</p>
                    </div>
                    <Link
                      href="/app/profile"
                      role="menuitem"
                      className="flex h-10 items-center rounded-xl px-3 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/app/settings"
                      role="menuitem"
                      className="flex h-10 items-center rounded-xl px-3 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="mt-1 cursor-pointer flex h-10 w-full items-center rounded-xl px-3 text-left text-sm text-rose-100 hover:bg-rose-500/10"
                      onClick={() => {
                        setUserMenuOpen(false);
                        trackAuthLogout({ source: "app_shell_menu" });
                        void signOut({ callbackUrl: "/login?loggedOut=1" });
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
      <div
        className={
          isLayoutStudio
            ? "h-screen w-full p-0"
            : "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6"
        }
      >
        <main className={isLayoutStudio ? "h-full w-full p-0" : ""}>{children}</main>
      </div>
    </div>
  );
}
