# Rich Text Format (Sprint 31)

## Canonical Format: Tiptap JSON

All rich text in Bloodline Storybook is stored as **Tiptap JSON** — the native serialization format of the [Tiptap](https://tiptap.dev) editor (MIT license).

### Document Structure

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Hello ", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": "world!" }
      ]
    }
  ]
}
```

### Supported Node Types

| Node | Description |
|---|---|
| `doc` | Root document node |
| `paragraph` | Block of text (default) |
| `heading` | H1–H6 with `attrs.level` |
| `bulletList` | Unordered list |
| `orderedList` | Ordered list |
| `listItem` | List item |
| `blockquote` | Quoted block |
| `codeBlock` | Code block |
| `hardBreak` | Line break within a paragraph |
| `horizontalRule` | `<hr>` separator |

### Supported Mark Types

| Mark | Description |
|---|---|
| `bold` | **Bold** |
| `italic` | *Italic* |
| `underline` | Underline |
| `strike` | ~~Strikethrough~~ |
| `code` | `inline code` |
| `link` | Hyperlink (attrs: `href`) |
| `textStyle` | Text color (attrs: `color`) |

## Storage Fields

### Chapter Answers (Wizard)

| Field | Type | Purpose |
|---|---|---|
| `answerRich` | `any` (Tiptap JSON) | Canonical rich content |
| `answerPlain` | `string` | Derived plain text for search / AI |
| `answerText` | `string` (legacy) | Legacy plain text; deprecated after migration |

### Studio Text Frames

| Field (in `frame.content`) | Type | Purpose |
|---|---|---|
| `contentRich` | Tiptap JSON | Canonical rich content |
| `plainText` | `string` | Derived plain text |
| `text` | `string` (legacy) | Legacy; preserved for backward compat |

## Shared Utilities (`packages/shared/richtext/`)

| Function | Description |
|---|---|
| `isValidTiptapDoc(json)` | Type guard for Tiptap JSON |
| `normalizeTiptapDoc(json)` | Returns a valid doc or empty doc |
| `plainTextToTiptapDoc(text)` | Converts plain text → Tiptap doc |
| `extractPlainText(doc)` | Extracts plain text from a Tiptap doc |
| `tiptapDocToHtml(doc)` | Serializes Tiptap doc → HTML (no XSS) |
| `appendPlainTextToDoc(doc, text)` | Appends text as a new paragraph |
| `replacePlainTextInDoc(doc, text)` | Replaces doc content with plain text |

## PDF Export

The PDF renderer (`packages/pdf/richtext/`) converts Tiptap JSON to sanitized HTML before rendering:

1. `tiptapDocToHtml(doc)` — custom serializer (no @tiptap deps)
2. `sanitizeRichtextHtml(html)` — strips unsafe tags/attributes
3. Result injected into the PDF layout div alongside node styles

## Migration (Studio)

Legacy text nodes with only `content.text` are automatically migrated to `contentRich` on first edit via `packages/editor/migrations/textToTiptap.ts`. Migration is:
- **Lazy**: only runs when a node is opened for editing
- **Idempotent**: running it twice produces the same result
- **Non-destructive**: `content.text` is preserved until explicit save
