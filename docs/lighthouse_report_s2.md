# Sprint 2 Lighthouse Report

Date: 2026-02-24
Status: Local code/perf hygiene verified; final Lighthouse scores require deployed preview/production URLs.

## Routes
- `/`
- `/pricing`
- `/gift`
- `/templates`

## Goal
- No regression from Sprint 1 targets
- Maintain responsive, image-safe marketing routes with shared block system

## Local Verification Completed
- `pnpm --filter web build` passes for all marketing routes
- Placeholder marketing visuals use `next/image` with explicit sizing and blur placeholders
- SEO/metadata routes generated (`/sitemap.xml`, `/robots.txt`, OG/Twitter image endpoints)
- No known new runtime warnings introduced during local build

## Perf Hygiene Notes (Sprint 2)
- Shared blocks are mostly server-rendered; interactive behavior is limited to nav, FAQ, slider, and waitlist form
- Below-the-fold sections remain lightweight (CSS gradients/cards, no large media/video payloads)
- Analytics script remains deferred via `next/script` and gated by env var
- Decorative visuals are vector placeholders and optimized image mocks

## Pending for Final Sign-off (External)
- [ ] Lighthouse mobile and desktop runs on Vercel preview/prod
- [ ] Record exact scores and any follow-up fixes
