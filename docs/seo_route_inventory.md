# SEO Route Inventory

## Public Routes (Indexable)

| Path | Title | Canonical | OG/Twitter | Sitemap | Structured Data |
|------|-------|-----------|------------|---------|-----------------|
| `/` | Create a Family Storybook | Yes (root layout) | Yes | Yes | Organization, WebSite, Product, FAQPage |
| `/pricing` | Pricing | Yes | Yes | Yes | - |
| `/templates` | Story Templates | Yes | Yes | Yes | - |
| `/gift` | Gift a Storybook | Yes | Yes | Yes | - |
| `/tech-stack` | Tech Stack | Yes | Yes | Yes | - |
| `/privacy` | Privacy Policy | Yes | Yes | Yes | - |
| `/terms` | Terms of Use | Yes | Yes | Yes | - |
| `/contact` | Contact | Yes | Yes | Yes | - |

## Private Routes (Noindex)

| Prefix | Purpose | Noindex Method |
|--------|---------|----------------|
| `/auth/*` | Authentication (sign-in, sign-up, etc.) | Layout metadata |
| `/app/*` | Authenticated dashboard & settings | Layout metadata |
| `/studio/*` | Storybook editor | Layout metadata |
| `/book/*` | Book chapter editing | Layout metadata |
| `/create/*` | Storybook creation flows | Layout metadata |
| `/billing/*` | Billing callbacks | Layout metadata |
| `/api/*` | API routes | robots.txt disallow |

## Key Files

- **Route inventory**: `apps/web/lib/seo/routes.ts`
- **SEO helpers**: `apps/web/lib/seo/metadata.ts`
- **Constants**: `apps/web/lib/seo/constants.ts`
- **Sitemap**: `apps/web/app/sitemap.ts` (generated from route inventory)
- **Robots**: `apps/web/app/robots.ts` (disallows private prefixes)
- **llms.txt**: `apps/web/app/llms.txt/route.ts` (generated from route inventory)
- **Structured data**: `apps/web/components/seo/structured-data.tsx`
