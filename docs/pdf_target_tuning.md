# PDF Target Tuning (Sprint 9 v1)

## Digital PDF
- Screen-friendly output
- Lower image threshold warnings
- `pdfScale` reduced slightly for smaller output (`0.95`)

## Hardcopy Print PDF
- Stricter preflight validation
- Higher image threshold checks
- `pdfScale` at `1.0` for print clarity
- Safe-area validation blocks text outside print-safe zone

## Renderer strategy
- Same HTML renderer and templates
- Target-specific config controls validation + PDF options
- Fonts remain vector via HTML/CSS + Chromium PDF output path

