# Sprint 1 Release Checklist (Memorioso)

Date: 2026-02-24
Status: Local implementation complete. Deployment/release execution pending Vercel.

## Vercel Setup
- [ ] Create Vercel project and connect repository
- [ ] Set production domain
- [ ] Enable preview deployments
- [ ] Confirm build command: `pnpm build`

## Environment Variables
- `NEXT_PUBLIC_SITE_URL` (e.g. `https://memorioso.com`)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (optional in Sprint 1; GA4)
- `WAITLIST_STORAGE_FILE` (optional local/dev override path)
- `WAITLIST_RATE_LIMIT_WINDOW_MS` (optional)
- `WAITLIST_RATE_LIMIT_MAX` (optional)

## Local QA Completed
- [x] Landing route implemented and renders from config-driven sections
- [x] Legal pages (`/privacy`, `/terms`, `/contact`) render
- [x] Waitlist API + honeypot + validation + rate limit implemented and tested locally
- [x] Metadata + OG/Twitter tags + JSON-LD implemented
- [x] Robots and sitemap endpoints implemented
- [x] GA4 client instrumentation implemented (env-gated)

## Production QA Checklist
- [ ] Mobile + desktop visual QA on landing page
- [ ] Broken link scan (`/`, `/privacy`, `/terms`, `/contact`)
- [ ] Waitlist form success + error + rate-limit behavior
- [ ] Analytics smoke test (CTA clicks, FAQ expand, waitlist submit)
- [ ] Metadata + OG/Twitter tags verified in page source
- [ ] JSON-LD present and valid for Product + FAQPage

## Release Notes (Fill Before Launch)
- Date:
- Version/Commit:
- Reviewer:
- Known limitations:
