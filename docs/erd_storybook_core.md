# Storybook Core ERD (Sprint 4 Foundation, Convex)

## Entities
- `storybooks` (owner-scoped root record)
- `chapters` (ordered children of storybook)
- `chapterBlocks` (ordered content blocks inside chapter)
- `assets` (owner-scoped media metadata)
- `collaborators` (future sharing model; owner-only policy baseline in Sprint 4)

## Relationships
- `storybooks._id` -> `chapters.storybookId` (mutation-level cascade delete)
- `chapters._id` -> `chapterBlocks.chapterId` (mutation-level cascade delete)
- `storybooks._id` -> `chapterBlocks.storybookId` (denormalized for query/authz simplicity)
- `storybooks._id` -> `collaborators.storybookId`
- `ownerId` stores Auth.js subject string (`session.user.id`)

## Design Notes
- Flexible `content` on `chapterBlocks` keeps the editor schema loose for Sprint 5.
- `ownerId` is denormalized onto child rows to simplify owner checks and future collaborator checks.
- `bookMode` exists now (`DIGITAL` / `PRINT`) to support future print-safe validation rules.
