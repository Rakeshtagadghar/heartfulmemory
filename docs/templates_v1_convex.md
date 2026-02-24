# Templates v1 (Convex, Sprint 4)

## Decision
- Templates are stored in code (seeded) for Sprint 4.
- Convex mutation `templates.apply` copies template content into user-owned `storybooks`, `chapters`, and `chapterBlocks`.

## Seed Templates
- `childhood_roots` (v1)
- `love_family` (v1)

## Apply Behavior
- Creates draft storybook (`DIGITAL`)
- Stores `settings.templateId` + `settings.templateVersion`
- Creates ordered chapters
- Creates one starter `TEXT` block per chapter

## Versioning
- Template seeds include `templateVersion`
- Applied books copy template content, so future seed updates do not mutate existing books

