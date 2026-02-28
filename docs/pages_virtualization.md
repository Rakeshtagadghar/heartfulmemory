# Pages Virtualization Notes (P1)

Current status:

- Continuous mode renders all pages for full editing fidelity.
- Virtualization trigger utility exists: `packages/editor/pages/virtualization.ts`.

Planned follow-up:

- Enable virtualization when page count exceeds threshold while always keeping active/nearby pages mounted.
- Skip virtualization while a page is actively being edited.
