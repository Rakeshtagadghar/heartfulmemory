# Sprint 19 Section Framework (Draft Generation)

Section generation is deterministic by `chapterKey`.

Base sections for all chapters:

- `intro` (Opening)
- `main` (The Story)
- `reflection` (Reflection)
- `closing` (Closing)

Overrides:

- `school`, `college`, or `class` chapter keys add `teachers_friends`
- `wedding`, `marriage`, or `ceremony` chapter keys add `ceremony_highlights`
- `origin`, `roots`, or `timeline` chapter keys add `timeline`

Implementation source:

- `packages/shared/templates/sectionFramework.ts`

