# Theme Queries v2 (Sprint 23)

Image theme/query generation now prefers `entitiesV2.places` and chapter type hints.

Rules:
- Use places from extracted entities as optional modifiers (e.g., `Maharashtra`, `India`)
- Use `chapterKey` style cues (origins/school/home) to vary queries
- Do not include personal names by default
- Add negative keywords to reduce repetitive portrait-heavy results

Examples:
- `origins`: ancestral home / landscape / neighborhood emphasis
- `school`: classroom / campus / documentary memory emphasis
- `home`: family home / interior / neighborhood emphasis
