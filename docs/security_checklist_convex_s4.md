# Sprint 4 Security Checklist (Convex)

## Function Access Review
- [x] `convex/storybooks.ts` uses authz helpers on all queries/mutations
- [x] `convex/chapters.ts` enforces storybook access before read/write
- [x] `convex/blocks.ts` enforces chapter -> storybook owner checks
- [x] `convex/assets.ts` enforces owner checks on reads/writes
- [x] `convex/templates.ts` requires authenticated subject before apply

## Manual Cross-User Checks (Run Against Real Convex Deployment)
- [ ] User A creates blank storybook
- [ ] User A applies template storybook
- [ ] User B cannot open User A storybook id route
- [ ] User B cannot list/read User A chapters/blocks via server flow
- [ ] Anonymous user is redirected away from `/app/*`
- [ ] Owner can reopen storybooks after refresh

## Fail-Closed Expectations
- `Unauthorized` when subject missing
- `Forbidden` when owner/collaborator permission fails
- `Not found` for missing records

