"use client";

import { useState } from "react";
import { useReducedMotionPreference } from "./landing/motion";

export function HeroVisual() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotionPreference();

  return (
    <div
      className="relative mx-auto w-full max-w-[540px] animate-rise [animation-delay:120ms]"
      onMouseMove={(event) => {
        if (prefersReducedMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: py * -8, y: px * 10 });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(213,179,106,0.18),transparent_60%)]" />
      <div
        className="relative aspect-[1.05/0.92] rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-4 shadow-glow backdrop-blur-xl transition-transform duration-300 motion-reduce:transform-none"
        style={{
          transform: prefersReducedMotion
            ? "none"
            : `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
        }}
      >
        <BookMock />
        <ChapterCard />
        <PosterCard />
      </div>
    </div>
  );
}

function BookMock() {
  return (
    <div className="relative h-full rounded-[1.4rem] border border-gold/20 bg-gradient-to-br from-[#162742] via-[#0f1d33] to-[#08101c] p-5">
      <div className="absolute inset-0 rounded-[1.4rem] bg-[radial-gradient(circle_at_18%_15%,rgba(213,179,106,0.13),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(198,109,99,0.12),transparent_45%)]" />
      <div className="absolute left-4 top-4 h-14 w-14 rounded-xl border border-gold/30 bg-gold/5" />
      <div className="absolute inset-y-6 left-[27%] w-px bg-gradient-to-b from-transparent via-gold/25 to-transparent" />
      <div className="relative ml-[31%] pr-1">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold/85">Heirloom Edition</p>
        <h3 className="mt-3 font-display text-3xl leading-none text-parchment sm:text-4xl">The House of Memory</h3>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Guided stories, cherished photographs, and family voices preserved in a keepsake format.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {["Childhood", "Letters", "Milestones", "Lessons"].map((label) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
              {label}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.4rem]">
        <div className="absolute top-[-30%] h-[160%] w-16 animate-sheen bg-gradient-to-r from-transparent via-white/15 to-transparent blur-sm" />
      </div>
    </div>
  );
}

function ChapterCard() {
  return (
    <div className="absolute -right-4 top-10 w-44 rounded-2xl border border-white/15 bg-[#101d33]/90 p-3 shadow-panel backdrop-blur-lg sm:w-52">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Chapter 04</p>
        <span className="rounded-full border border-gold/35 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
          QR later
        </span>
      </div>
      <h4 className="mt-2 font-display text-xl text-parchment">First Home</h4>
      <p className="mt-2 text-xs leading-5 text-white/60">
        I still remember the blue gate and the jasmine vines by the window.
      </p>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
          <div className="mb-1 h-1.5 w-20 rounded-full bg-white/10" />
          <div className="h-1.5 w-12 rounded-full bg-white/10" />
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-[10px] text-white/50">QR</div>
      </div>
    </div>
  );
}

function PosterCard() {
  return (
    <div className="absolute -bottom-6 left-4 w-40 rotate-[-5deg] rounded-2xl border border-gold/20 bg-[#f0e7d8] p-3 text-ink shadow-panel sm:w-48">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/60">Family Tree Poster</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-md border ${i === 4 ? "border-[#b78a37] bg-[#d5b36a]/25" : "border-black/10 bg-white/60"}`}
          />
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-4 text-ink/70">
        Future add-on concepts: lineage poster and story chapter audio links.
      </p>
    </div>
  );
}
