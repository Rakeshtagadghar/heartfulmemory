# QA Checklist - Sprint 5 (Convex Editor v0)

## Environment
- `apps/web/.env.local` configured with `NEXTAUTH_*` and `NEXT_PUBLIC_CONVEX_URL`
- Convex tables/functions deployed (`users`, `storybooks`, `chapters`, `chapterBlocks`, etc.)
- `pnpm --filter web dev` running

## Core Smoke Flows (Required)

### 1. Create Storybook from Template
- Sign in and open `/app/templates`
- Apply a template
- Confirm redirect to `/app/storybooks/:id`
- Confirm chapters are present and ordered
- Refresh page and confirm storybook/chapters persist

### 2. Create Blank Storybook (Dashboard + Start Flow)
- Open `/app`
- Click `Quick Blank`
- Confirm redirect to `/app/storybooks/:id`
- Confirm empty chapter state appears
- Add a chapter and refresh page
- Confirm chapter persists

### 3. Rename Storybook and Chapter
- In storybook editor, rename storybook title/subtitle and save
- Refresh page and confirm values persist
- Rename selected chapter title (sticky header or sidebar)
- Refresh page and confirm rename persists

### 4. Edit Text + Insert Image Placeholder + Refresh
- Add a text block
- Type content and wait for `Saved`
- Add an image placeholder block
- Change caption/placement/size and wait for `Saved`
- Refresh page
- Confirm text block content persists
- Confirm image placeholder settings persist

### 5. Reorder Chapters
- Add at least 3 chapters
- Reorder via drag and drop
- Reorder via `Up`/`Down` buttons
- Refresh page
- Confirm order persists

### 6. Conflict-Safe v0 (Two Tabs)
- Open same chapter in two tabs
- Save text change in tab A
- Save conflicting change in tab B
- Confirm conflict banner appears
- Verify `Reload` and `Overwrite` flows work

### 7. AuthZ / Unauthorized Access
- Copy a storybook URL from account A
- Sign into account B
- Attempt to open account A storybook URL
- Confirm access is blocked / page does not expose storybook data

## Regression Checks
- No browser console errors during create/edit/reorder flow
- Mobile viewport (`~390px`) has no horizontal scroll in editor page
- Chapter drawer opens/closes on mobile and chapter switching remains usable

