# Export Presets v1 (Sprint 9)

## Targets
- `DIGITAL_PDF`
- `HARDCOPY_PRINT_PDF`

## Storybook export settings shape
- `exportTargets.digitalPdf`
- `exportTargets.hardcopyPdf`
- `pageSize` (`A4`, `US_LETTER`, `BOOK_6X9`, `BOOK_8_5X11`)
- `margins` (px)
- `printPreset`
- `digitalPreset`

## Defaults
- Both targets enabled by default
- Page size defaults to `BOOK_8_5X11`
- Print preset is stricter (`safeAreaPadding`, higher min image width)
- Digital preset favors smaller/faster output

## Notes
- Backward compatibility supports legacy `exportTargets.printPdf`
- Settings are normalized at export time before validation/render

