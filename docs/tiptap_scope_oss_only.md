# Tiptap Scope: OSS-Only Extensions (Sprint 31)

## Decision

We use **Tiptap** (MIT-licensed) for rich text editing in:
1. **Wizard answer editor** – inline formatting on Q&A answers
2. **Studio text boxes** – formatting inside canvas text frames

## Canonical Storage Format

| Field | Type | Purpose |
|---|---|---|
| `answerRich` | Tiptap JSON (`{ type: "doc", … }`) | Canonical rich content |
| `answerPlain` | `string` | Derived plain text; used by search, AI, quota counting |
| `answerText` | `string` (legacy) | Kept for backwards compat; deprecated after migration |

For Studio frames, the same pattern applies inside `frame.content`:
| Field | Type | Purpose |
|---|---|---|
| `contentRich` | Tiptap JSON | Canonical rich content |
| `plainText` | `string` | Derived plain text |
| `text` | `string` (legacy) | Kept for backwards compat |

## OSS Extensions Used

All extensions are MIT-licensed and free to use:

| Extension | Package | Purpose |
|---|---|---|
| StarterKit | `@tiptap/starter-kit` | history, paragraph, hardBreak, bold, italic, strike, blockquote, code, headings, bullet/ordered lists, horizontal rule |
| Underline | `@tiptap/extension-underline` | `<u>` mark |
| Link | `@tiptap/extension-link` | Hyperlinks (open-on-click disabled in editor) |
| Placeholder | `@tiptap/extension-placeholder` | Placeholder text when editor is empty |
| TextStyle | `@tiptap/extension-text-style` | Required for Color |
| Color | `@tiptap/extension-color` | Inline text color |
| TextAlign | `@tiptap/extension-text-align` | Paragraph alignment |
| Typography | `@tiptap/extension-typography` | Smart quotes, ellipsis, etc. |
| CharacterCount | `@tiptap/extension-character-count` | Optional character/word count |
| BubbleMenu | `@tiptap/react` | Floating selection toolbar |
| FloatingMenu | `@tiptap/react` | Floating toolbar on empty line |

## Explicitly Excluded

- **Tiptap Platform / Cloud** – no Comments, Snapshots, Content AI
- **Real-time collaboration (Yjs)** – out of scope for Sprint 31
- **Pro extensions** – any extension behind a paywall

## Package Installation

Installed in `apps/web` and `packages/editor` (peer dependency pattern).

```
pnpm add --filter web \
  @tiptap/react \
  @tiptap/starter-kit \
  @tiptap/extension-underline \
  @tiptap/extension-link \
  @tiptap/extension-placeholder \
  @tiptap/extension-text-style \
  @tiptap/extension-color \
  @tiptap/extension-text-align \
  @tiptap/extension-typography \
  @tiptap/extension-character-count
```

## Serialization

Tiptap JSON is the canonical format stored in Convex. We maintain a pure-TypeScript serializer in `packages/shared/richtext/tiptapToHtml.ts` that converts Tiptap JSON to HTML without requiring Tiptap packages (used by the PDF renderer and SSR read-only views).

## Performance

- Studio text nodes render as **read-only HTML** by default (no live contenteditable).
- A live Tiptap editor is mounted **only for the active node** (double-click to edit).
- This ensures no dozens of contenteditable nodes are mounted simultaneously.
