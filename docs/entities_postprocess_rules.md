# Entities Post-Processing Rules v1

Deterministic cleanup only (no LLM calls):

- Trim and collapse whitespace
- Deduplicate entities case-insensitively
- Remove people stopwords/pronouns (`the`, `our`, `my`, `i`, `we`, ...)
- Reject weak person values (too short unless relationship role)
- Preserve relationship roles as `kind=role`
- Keep single-token places when they look geographic (e.g. `India`, `Maharashtra`)
- Normalize dates to ISO-ish values where possible:
  - `YYYY`
  - `YYYY-MM` for month/year inputs
- Emit warnings for removed invalid/low-quality entities

Post-processing never mutates original chapter answers.
