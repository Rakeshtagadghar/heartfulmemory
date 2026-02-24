# Sprint 2 Design System (Marketing)

## Goals
- Reusable primitives for marketing pages and future routes
- Centralized tokens and consistent focus/hover states
- Premium visual language with accessible contrast

## Tokens
- Source: `apps/web/design/tokens.ts`
- Includes:
  - colors
  - spacing
  - radius
  - shadows
  - typography

## Primitives
- `Button`, `ButtonLink`
- `TextLink`
- `Card`
- `Badge`
- `Chip`
- `Tag`
- `Divider`
- `Container`
- `Section`, `SectionHeader`

## Guidelines
### Do
- Use `Button`/`ButtonLink` for all CTA styles
- Keep section shells composition-friendly (content via props/config)
- Preserve visible focus rings (`focus-visible:ring-gold`)
- Prefer tokens and utility wrappers over ad hoc duplicated styles

### Don't
- Hard-code colors in page sections if a primitive/token exists
- Add one-off CTA styles outside the primitive variants
- Remove focus rings for aesthetic reasons

## Examples
```tsx
<ButtonLink href="/pricing" variant="primary" size="lg">
  See pricing
</ButtonLink>

<Card className="p-6">
  <SectionHeader kicker="Pricing" title="Simple plans" />
</Card>
```

