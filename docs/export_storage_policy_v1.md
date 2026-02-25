# Export Storage Policy v1 (Sprint 9)

## Scope
- Optional storage of generated PDFs in Cloudflare R2
- Key format: `exports/{storybookId}/{exportTarget}/{exportHash}.pdf`
- Access via short-lived signed URLs only

## Security
- Export files are stored in a private bucket
- Signed download URLs are generated server-side for authenticated owners only
- Export history stores `fileKey`; `fileUrl` may be short-lived and omitted/stale

## Cost control
- Storage is optional and env-gated (`EXPORT_PDF_STORE_R2=true`)
- Retention policy is not implemented in v1 (follow-up sprint)
- Monitor R2 usage and apply lifecycle rules before enabling broadly

## Re-download behavior
- UI re-download links call authenticated app route which signs an R2 GET URL
- If file is missing or storage disabled, route returns a controlled error

