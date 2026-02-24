"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MemoriosoLogo } from "../memorioso-logo";
import { TrackedLink } from "../tracked-link";
import { buttonClassName } from "../ui/button";
import { cn } from "../ui/cn";

type NavLink = { label: string; href: string };

export function NavBar({
  links,
  cta = {
    label: "Start",
    href: "/app/start",
    eventName: "cta_start_click",
    eventProps: { section: "header" as const }
  }
}: {
  links: NavLink[];
  cta?: {
    label: string;
    href: string;
    eventName?: string;
    eventProps?: Record<string, string>;
  };
}) {
  const [open, setOpen] = useState(false);
  const [activeHashHref, setActiveHashHref] = useState<string>("");
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();
  const hashLinks = useMemo(
    () => links.filter((link) => link.href.startsWith("#")),
    [links]
  );

  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const root = drawerRef.current;
    if (!root) return;

    document.body.style.overflow = "hidden";

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    focusable[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    root.addEventListener("keydown", onKeyDown);
    const toggleButton = toggleButtonRef.current;

    return () => {
      root.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      toggleButton?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!hashLinks.length || typeof window === "undefined") return;
    if (pathname !== "/") return;

    const sections = hashLinks
      .map((link) => ({
        href: link.href,
        el: document.getElementById(link.href.slice(1))
      }))
      .filter((item): item is { href: string; el: HTMLElement } => Boolean(item.el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const match = sections.find((section) => section.el === visible.target);
        if (match) setActiveHashHref(match.href);
      },
      {
        rootMargin: "-18% 0px -60% 0px",
        threshold: [0.2, 0.4, 0.6]
      }
    );

    sections.forEach((section) => observer.observe(section.el));
    return () => observer.disconnect();
  }, [hashLinks, pathname]);

  const routeActiveHref = links.find(
    (link) => !link.href.startsWith("#") && link.href === pathname
  )?.href;
  const activeHref =
    routeActiveHref ??
    activeHashHref ??
    (pathname === "/" ? hashLinks[0]?.href ?? "" : "");

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto w-full max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] shadow-[0_12px_40px_rgba(4,10,20,0.35)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute left-8 top-0 h-px w-28 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <div className="pointer-events-none absolute -right-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-gold/20 bg-gold/10 blur-xl" />

          <div className="relative mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-6">
            <MemoriosoLogo />

            <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Primary">
              {links.map((link) => (
                <a
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-white/75 transition hover:bg-white/[0.05] hover:text-white",
                    activeHref === link.href && "bg-white/[0.06] text-parchment"
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <TrackedLink
                href={cta.href}
                eventName={cta.eventName}
                eventProps={cta.eventProps}
                className={cn(
                  buttonClassName({ variant: "primary", size: "md" }),
                  "hidden md:inline-flex"
                )}
              >
                {cta.label}
              </TrackedLink>

              <button
                ref={toggleButtonRef}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-white md:hidden"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {open ? (
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 top-[56px] bg-black/15 md:hidden"
              onClick={() => setOpen(false)}
            />
          ) : null}

          <div
            id="mobile-nav"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className={cn(
              "relative z-[1] grid transition-[grid-template-rows] duration-300 md:hidden",
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-6">
                <nav className="flex flex-col gap-2" aria-label="Primary mobile">
                  {links.map((link) => (
                    <a
                      key={`${link.href}-${link.label}-mobile`}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.05]",
                        activeHref === link.href && "bg-white/[0.06] text-parchment"
                      )}
                    >
                      {link.label}
                    </a>
                  ))}
                  <TrackedLink
                    href={cta.href}
                    eventName={cta.eventName}
                    eventProps={cta.eventProps}
                    className={cn(buttonClassName({ variant: "primary", size: "md" }), "mt-2")}
                    onClick={() => setOpen(false)}
                  >
                    {cta.label}
                  </TrackedLink>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
