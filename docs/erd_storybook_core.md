# Storybook Core ERD (Sprint 4 Foundation)

## Entities
- `storybooks` (owner-scoped root record)
- `chapters` (ordered children of storybook)
- `chapter_blocks` (ordered content blocks inside chapter)
- `assets` (owner-scoped media metadata)
- `collaborators` (future sharing model; owner-only policy baseline in Sprint 4)

## Relationships
- `storybooks.id` -> `chapters.storybook_id` (cascade delete)
- `chapters.id` -> `chapter_blocks.chapter_id` (cascade delete)
- `storybooks.id` -> `chapter_blocks.storybook_id` (denormalized for query/RLS simplicity)
- `storybooks.id` -> `collaborators.storybook_id` (cascade delete)
- `auth.users.id` -> `owner_id` on storybooks/chapters/blocks/assets

## Design Notes
- JSONB `content` on `chapter_blocks` keeps the editor flexible while Sprint 4 establishes storage and RLS.
- `owner_id` is denormalized onto child rows to simplify RLS policies and reduce joins.
- `book_mode` exists now (`DIGITAL` / `PRINT`) to support future print-safe validation rules.
