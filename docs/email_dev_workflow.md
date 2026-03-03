# Email Dev Workflow (Sprint 37)

## Workspace
- Templates live in `packages/emails`.
- Main entrypoint is `@memorioso/emails`.

## Commands
- `pnpm email:dev`
: Start React Email preview using templates in `packages/emails/src/templates`.
- `pnpm email:build`
: Export static HTML files to `packages/emails/dist`.
- `pnpm email:compat`
: Export templates and run compatibility safety checks (unsupported CSS patterns, non-HTTPS links, expected width guard).
- `pnpm --filter @memorioso/emails typecheck`
: Typecheck email templates and contracts.

## How to add a new template
1. Add variable schema in `packages/emails/src/contracts`.
2. Add React template in `packages/emails/src/templates`.
3. Add plain-text fallback in `packages/emails/src/templates/auth/plaintext.ts` (or relevant domain file).
4. Wire rendering in `packages/emails/src/render.tsx`.
5. Consume from app send layer (`apps/web/lib/email/*`).

## CI notes
- `pnpm lint` and `pnpm typecheck` include this workspace package via turbo.
- `pnpm email:build` should be run in release validation when email markup changes.
- `pnpm email:compat` should run in release validation for email-client safety checks.
