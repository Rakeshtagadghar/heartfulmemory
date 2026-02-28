# Page Ops Contract (Sprint 30 v1)

Page chrome state is persisted in:

- `storybook.settings.studioDocMeta.pageUiStateV1`

Shape:

```ts
type PageUiStateV1 = {
  title?: string;
  isHidden?: boolean;
  isLocked?: boolean;
};

type PageUiStateMapV1 = Record<string, PageUiStateV1>;
```

Supported operations in Studio:

- Move page up/down (via existing reorder API).
- Add page (end) and add page after current page.
- Duplicate and delete page.
- Toggle hidden and locked at page level.
- Update page title.

Utility module:

- `packages/editor/model/pageOps.ts`
  - `reorderPagesByMove`
  - `insertPageIdAfter`
  - `normalizePageUiStateMapV1`
  - `upsertPageUiStateV1`
