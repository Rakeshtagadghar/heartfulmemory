# Convex Schema: Storybook Core (Sprint 4)

## Collections
- `users` (existing from Sprint 3.5)
- `waitlist` (existing from Sprint 3.5)
- `storybooks`
- `chapters`
- `chapterBlocks`
- `assets`
- `collaborators`

## Identity Strategy
- `ownerId` is stored as the Auth.js subject string (`session.user.id`).
- This keeps owner checks simple while Convex auth token plumbing is still in migration.
- Collaborators also use `userId` as auth subject string (optional until invite acceptance exists).

## Primary Indexes
- `storybooks.by_ownerId`
- `storybooks.by_ownerId_updatedAt`
- `chapters.by_storybookId_orderIndex`
- `chapters.by_ownerId`
- `chapterBlocks.by_chapterId_orderIndex`
- `chapterBlocks.by_storybookId`
- `chapterBlocks.by_ownerId`
- `assets.by_ownerId`
- `assets.by_storageKey`
- `collaborators.by_storybookId`
- `collaborators.by_userId`
- `collaborators.by_invitedEmail`

## Design Notes
- `chapterBlocks.content` uses flexible `v.any()` for Sprint 5 editor compatibility.
- `storybooks.settings` stores template metadata (`templateId`, `templateVersion`) when seeded.
- `collaborators` is included now so sharing can be expanded without schema migration churn.

