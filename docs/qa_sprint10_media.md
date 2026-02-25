# Sprint 10 Media QA Checklist

## Uploads

- Upload `png`, `jpg`, and `webp`
- Oversized file is rejected with clear error
- Invalid file type is rejected with clear error
- Upload success shows non-blocking toast
- Uploaded image appears in Uploads panel without page refresh
- Clicking uploaded image inserts onto active page
- Rapid double-click on upload thumbnail inserts only once

## Photos (Unsplash/Pexels)

- Photos panel loads trending results by default
- Search returns results after debounce
- Provider toggle works (`All`, `Unsplash`, `Pexels`) when enabled
- Provider API failure shows retryable error state
- Clicking provider result inserts onto active page
- Rapid double-click on provider result inserts only once

## Canvas Insert + Persistence

- Inserted image is auto-selected
- Image appears centered on page and aspect-fit sized
- Move image works without jitter
- Resize preserves aspect ratio by default
- Shift + resize allows free resize
- Refresh page and verify inserted image still renders
- Attribution metadata exists in frame `content.attribution` for provider inserts

## Export / Read Path Smoke

- Inserted upload image renders in studio after refresh
- Inserted provider image renders in studio after refresh
- Preview/export still works with inserted images
