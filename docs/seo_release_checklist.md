# SEO Release Checklist

## Metadata
- [ ] Every public page has unique `<title>` (check view-source)
- [ ] Every public page has `<meta name="description">` (150-160 chars)
- [ ] Every public page has `<link rel="canonical">`
- [ ] OG tags present: `og:title`, `og:description`, `og:url`, `og:image`
- [ ] Twitter tags present: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- [ ] No duplicate titles across pages

## Crawlability
- [ ] `/sitemap.xml` is reachable and contains only public URLs
- [ ] `/robots.txt` is reachable, references sitemap, blocks private routes
- [ ] `/llms.txt` is reachable and lists public pages

## Noindex
- [ ] `/auth/*` pages have `noindex, nofollow`
- [ ] `/app/*` pages have `noindex, nofollow`
- [ ] `/studio/*` pages have `noindex, nofollow`
- [ ] `/book/*` pages have `noindex, nofollow`
- [ ] `/create/*` pages have `noindex, nofollow`
- [ ] `/billing/*` pages have `noindex, nofollow`

## Structured Data
- [ ] Organization schema present on landing page
- [ ] WebSite schema present on landing page
- [ ] Product schema present on landing page
- [ ] FAQPage schema present and matches visible FAQ items

## Assets
- [ ] Favicon (`/icon.svg`) loads correctly
- [ ] OG image (`/opengraph-image`) renders at 1200x630
- [ ] Twitter image (`/twitter-image`) renders correctly

## Performance
- [ ] No heavy scripts blocking public page render
- [ ] No CLS regressions on public pages

## Search Console
- [ ] Submit sitemap URL to Google Search Console
- [ ] Verify site ownership via DNS TXT or HTML file method
