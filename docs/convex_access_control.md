# Convex Access Control Pattern (Sprint 3.5 Foundation)

- Convex permissions are enforced in server functions, not SQL RLS.
- Store owner identifiers on documents (`ownerId` / `authSubject`).
- Centralize checks in `convex/authz.ts` (`requireUser`, `requireOwner`).
- Every query/mutation must validate auth and ownership before returning or mutating data.

Note: Sprint 3.5 local build uses a server-side NextAuth bridge; full token bridging to Convex auth is a follow-up step.
