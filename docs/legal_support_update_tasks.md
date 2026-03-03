# Legal + Support Update Tasks

Date: March 3, 2026

## Information gathered
- Existing `/privacy`, `/terms`, and `/contact` pages were Sprint 1 stub pages.
- Contact page used placeholder email `hello@memorioso.example`.
- Some UI still pointed to the old support email `support@heartfulmemory.com`.
- Email template support fallback URL pointed to `/support` (no dedicated support page route).

## Tasks
- [x] Define a single support contact source in code.
- [x] Set support email to `hello@memorioso.co.uk`.
- [x] Replace old support email references in UI.
- [x] Rewrite `/privacy` with non-stub policy content and explicit support contact.
- [x] Rewrite `/terms` with non-stub terms content and explicit support contact.
- [x] Upgrade `/contact` page with structured support details and direct mailto CTA.
- [x] Update email support fallback URL to `/contact`.
- [x] Update emails package default support URL to `/contact`.
- [ ] Legal review by counsel before public launch (recommended).
