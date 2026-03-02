# Memorioso

A family storybook you'll pass down — a SaaS memoir platform that helps users create beautiful memory books through guided Q&A, AI-powered chapter drafting, a visual Studio canvas editor, and PDF export.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4 |
| Backend | Convex 1.32 (server-side HTTP client) |
| Rich Text | Tiptap 3.20 |
| Media Storage | Cloudflare R2 (S3-compatible) |
| Auth | NextAuth v4 (magic link) |
| Billing | Stripe (Free + Pro tiers) |
| AI / Voice | Groq, ElevenLabs (STT + narration) |
| PDF Export | Puppeteer + @sparticuz/chromium |
| Error Tracking | Sentry |
| Testing | Vitest 4 (unit/integration), Playwright (e2e) |
| Build | Turborepo 2.8, pnpm 10.30 |

## Monorepo Structure

```
apps/web/          # Next.js application
packages/editor/   # @memorioso/editor — Studio canvas editor components
packages/shared/   # Shared types + utilities (pure TypeScript)
packages/pdf/      # @memorioso/pdf — PDF rendering pipeline
convex/            # Convex backend (schema, queries, mutations)
docs/              # Architecture & sprint docs (90+ documents)
requirements/      # Sprint specifications
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** 10.30+ (`corepack enable` to activate)
- A [Convex](https://www.convex.dev/) project
- Cloudflare R2 bucket for media storage
- Stripe account for billing

### Install

```bash
pnpm install
```

### Environment Variables

Copy the example and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required variables by service:

| Service | Variables |
|---|---|
| **Convex** | `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_URL` |
| **NextAuth** | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` |
| **Cloudflare R2** | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| **Stripe** | `BILLING_MODE`, `STRIPE_SECRET_KEY_TEST`, `STRIPE_WEBHOOK_SECRET_TEST`, `STRIPE_PRICE_ID_PRO_TEST` |
| **AI / Voice** | `GROQ_API_KEY` (or `ELEVENLABS_API_KEY`), `AI_PROVIDER_DEFAULT`, `STT_PROVIDER_DEFAULT` |
| **Stock Photos** | `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY` |
| **Sentry** | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |

### Development

```bash
pnpm dev
```

This starts the Next.js dev server and all workspace packages via Turborepo.

### Build

```bash
pnpm build
```

### Linting & Type Checking

```bash
pnpm lint
pnpm typecheck
```

## Testing

```bash
pnpm test              # All tests
pnpm test:unit         # Unit tests (Vitest)
pnpm test:integration  # Integration tests (Vitest)
pnpm test:e2e          # End-to-end tests (Playwright)
```

## Key Features

### Guided Q&A Wizard
Users answer chapter prompts through a step-by-step wizard with rich text editing, voice input (speech-to-text), and autosave.

### AI Chapter Drafting
Answers are processed by an AI pipeline that generates structured chapter drafts with sections, key facts, quotes, and entity extraction.

### Auto-Illustration
Chapters are automatically matched with relevant stock photos from Unsplash and Pexels based on extracted content.

### Studio Canvas Editor
A visual page editor for arranging text, images, shapes, and frames on canvas pages with support for single-page and continuous view modes.

### PDF Export
Generates print-ready PDFs using a Puppeteer-based rendering pipeline. Supports presets: A4, US Letter, Book 6×9, Book 8.5×11.

### Collaboration
Storybooks support multiple collaborators with Owner, Editor, and Viewer roles.

## Architecture Notes

- **Convex access pattern**: All database calls go through `ConvexHttpClient` on the server side — no React hooks (`useQuery`/`useMutation`). Client components call Next.js API routes which call Convex internally.
- **Rich text**: Tiptap 3.20 (OSS) with lazy migration from legacy plain-text nodes. Rich text is stored as Tiptap JSON alongside extracted plain text.
- **Media**: Cloudflare R2 via AWS S3 SDK with presigned upload URLs and free-tier usage guards.

## Packages

### `@memorioso/editor`
React component library for the Studio canvas. Includes renderers for text, image, shape, line, and frame nodes, plus rich text editing overlays and bubble menus.

### `@memorioso/pdf`
PDF rendering pipeline. Serializes Tiptap rich text to HTML, sanitizes it, and renders pages through Puppeteer/Chromium for high-fidelity output.

### `packages/shared`
Pure TypeScript types and utilities shared across the monorepo — billing rules, draft types, entity extraction, flow definitions, rich text helpers, and template schemas.
