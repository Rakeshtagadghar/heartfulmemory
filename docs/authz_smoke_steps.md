# AuthZ Smoke Steps (Sprint 4, Convex)

## Pre-req
- Convex deployment configured (`NEXT_PUBLIC_CONVEX_URL`)
- App running locally
- Two test users (User A / User B) using the Auth.js credentials fallback

## Steps
1. Sign in as User A and complete onboarding.
2. Go to `/app/start`, create a blank storybook.
3. Copy resulting `/app/storybooks/:id` URL.
4. Verify dashboard shows the new book after refresh.
5. Sign out, sign in as User B.
6. Open User A URL.
7. Expected result: error card (forbidden/not found style) and no storybook data leakage.
8. As User B, create a template-based storybook and confirm chapters render in order.
9. Sign out and open `/app` directly in a fresh browser session.
10. Expected result: redirect to `/login`.

## Record
- Capture date, environment, and any unexpected access behavior in `docs/release_checklist_s4_convex.md`.

