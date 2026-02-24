# Convex Access Control (Storybooks, Sprint 4)

## Model
- Owner-first authorization (`OWNER > EDITOR > VIEWER`)
- Sprint 4 write access is owner-only
- Collaborator reads are schema/helper-ready but sharing UX is deferred

## Helper Contract (`convex/authz.ts`)
- `requireUser(ctx, explicitSubject?)`
- `requireOwner(viewer, ownerOrDoc)`
- `canAccessStorybook(ctx, storybookId, minRole, explicitSubject?)`
- `assertCanAccessStorybook(ctx, storybookId, minRole, explicitSubject?)`

## Current Auth Bridge Note
- Convex native auth identity is not fully wired yet in runtime requests.
- Next.js passes `viewerSubject` (`session.user.id`) into Convex functions.
- `requireUser` checks Convex identity first, then falls back to `explicitSubject`.

## Fail-Closed Rules
- Missing subject -> `Unauthorized`
- Missing record -> `Not found`
- Subject mismatch / insufficient role -> `Forbidden`

