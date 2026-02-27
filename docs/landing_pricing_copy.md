# Landing Pricing Copy (Sprint 26)

## Core Message

- Free plan for creation/editing.
- Pro export plan at **GBP 30/month**.
- Pro includes **100 PDF exports/month** and hardcopy-ready output.

## CTA Routing

- `Start free` -> `/create/template`
- `Upgrade to export` -> `/app/account/billing?intent=upgrade`
  - If logged out: redirected to login, then back to billing.
  - If logged in: billing page auto-starts checkout when `intent=upgrade`.

## FAQ Update

Added: “Why do I need Pro to export?”

Answer: Free is for writing/editing; Pro unlocks PDF export.
