# Alpha Messaging Policy (Sprint 41)

## Purpose
Keep Early Alpha and billing sandbox messaging consistent across landing + app + upgrade flows.

## Single Source Of Truth
- `apps/web/content/alphaMessaging.ts`

## Canonical Copy
- Badge: `Early Alpha`
- Short blurb: `Early Alpha - features may change. Your feedback helps us improve.`
- Info title: `What does Early Alpha mean?`
- Sandbox headline: `SANDBOX / TEST MODE`
- Sandbox subheadline: `No real money will be taken.`

## Placement Map
- Landing hero: Early Alpha badge + short blurb + learn-more anchor to FAQ.
- Landing FAQ: alpha status question + sandbox payments question.
- App shell header: always-visible Early Alpha badge.
- App shell body: dismissible alpha banner (30-day localStorage persistence).
- App shell modal: explanatory alpha info with feedback/contact link.
- Upgrade modal: bold sandbox notice + Stripe test-card helper when billing mode is test.

## Rules
- Keep tone clear, calm, and elder-friendly.
- Do not hide sandbox notice in test mode checkout flows.
- Do not show sandbox notice in live mode.
- Avoid jargon and fear-heavy language.

