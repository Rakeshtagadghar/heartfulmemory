# Featurebase Changelog Install

## Current implementation

- The Changelog widget is initialized from the authenticated app shell only.
- Dashboard has a visible `What's new` launcher.
- App shell account menu includes `What's new`.
- Studio header menu includes `What's new`.

## Badge behavior

- Unread count is stored locally in `localStorage`.
- The loader listens for Featurebase `unreadChangelogsCountChanged` callbacks and updates the badge.
- Opening the changelog marks all updates as viewed and clears the local badge count.

## SDK flow

- Widget init: `init_changelog_widget`
- Manual open: `Featurebase("manually_open_changelog_popup")`
- Mark viewed: `Featurebase("set_all_changelogs_as_viewed")`

## Required env

- `NEXT_PUBLIC_FEATUREBASE_ENABLED=true`
- `NEXT_PUBLIC_FEATUREBASE_ORGANIZATION=<org>`
