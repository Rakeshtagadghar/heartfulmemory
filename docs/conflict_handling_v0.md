# Conflict Handling v0 (Sprint 5, Convex)

## Scope
- Prevent accidental overwrites when the same `chapterBlocks` record is edited from multiple tabs.
- No realtime collaboration yet.
- Conflict detection is block-level only (not chapter-level).

## Current Mechanism
- `chapterBlocks.version` is stored in Convex.
- Editor sends `expectedVersion` on autosave updates.
- `convex/blocks.ts` rejects mismatched versions with:
  - `CONFLICT:block_version_mismatch:<currentVersion>`
- `apps/web/lib/data/blocks.ts` maps that to `code: "conflict"`.
- UI shows `ConflictBanner` with:
  - `Reload` (reload latest chapter blocks from server)
  - `Overwrite` (retry update without `expectedVersion`)

## UX Behavior (v0)
- Typing continues locally even if a conflict occurs.
- Save status changes to `Conflict detected`.
- User can reload remote data or force overwrite.
- No merge UI yet.

## Known Limitations
- Conflict message is generic and does not show a visual diff.
- `Overwrite` is last-write-wins.
- Conflicts are per block; simultaneous changes in different blocks do not conflict.

## Manual Verification
1. Open the same storybook chapter in two tabs.
2. Edit the same text block in tab A and wait for `Saved`.
3. Edit the same block in tab B and wait for autosave.
4. Confirm tab B shows a conflict banner.
5. Click `Reload` and verify latest server content loads.
6. Edit again in tab B and click `Overwrite`.
7. Confirm the save succeeds and refresh shows the overwritten content.

