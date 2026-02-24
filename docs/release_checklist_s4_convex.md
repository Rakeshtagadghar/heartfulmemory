# Sprint 4 Release Checklist (Convex)

## Deploy
- [ ] Deploy Convex schema/functions (`convex dev` or deploy pipeline)
- [ ] Confirm no deploy errors for `storybooks`, `chapters`, `blocks`, `assets`, `templates`
- [ ] Deploy web app with Auth.js + Convex env vars set

## Production Verification
- [ ] Sign in and complete onboarding
- [ ] Create blank storybook from `/app/start`
- [ ] Create template storybook from `/app/start`
- [ ] Open created storybook and verify chapter order
- [ ] Refresh `/app` and confirm storybooks list persists
- [ ] Cross-user access denial verified manually
- [ ] Anonymous `/app/*` redirect verified

## Notes
- Current runtime uses explicit `viewerSubject` bridging from Auth.js session into Convex authz helpers.
- Convex native auth identity can replace this later without changing schema or route UX.

