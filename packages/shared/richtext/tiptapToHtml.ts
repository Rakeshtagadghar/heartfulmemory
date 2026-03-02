import type { TiptapDoc, TiptapNode, TiptapMark } from "./tiptapTypes";

function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyMarks(content: string, marks: TiptapMark[]): string {
  let result = content;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        result = `<strong>${result}</strong>`;
        break;
      case "italic":
        result = `<em>${result}</em>`;
        break;
      case "underline":
        result = `<u>${result}</u>`;
        break;
      case "strike":
        result = `<s>${result}</s>`;
        break;
      case "code":
        result = `<code>${result}</code>`;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? escapeHtml(mark.attrs.href) : "#";
        result = `<a href="${href}" rel="noopener noreferrer">${result}</a>`;
        break;
      }
      case "textStyle": {
        const color = typeof mark.attrs?.color === "string" ? escapeHtml(mark.attrs.color) : null;
        if (color) result = `<span style="color:${color}">${result}</span>`;
        break;
      }
      default:
        break;
    }
  }
  return result;
}

function renderNode(node: TiptapNode): string {
  if (node.type === "text") {
    const escaped = escapeHtml(node.text ?? "");
    return node.marks ? applyMarks(escaped, node.marks) : escaped;
  }

  if (node.type === "hardBreak") return "<br>";

  const inner = (node.content ?? []).map(renderNode).join("");

  switch (node.type) {
    case "doc":
      return inner;
    case "paragraph":
      return `<p>${inner || "<br>"}</p>`;
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? Math.min(6, Math.max(1, node.attrs.level)) : 1;
      return `<h${level}>${inner}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${inner}</ul>`;
    case "orderedList":
      return `<ol>${inner}</ol>`;
    case "listItem":
      return `<li>${inner}</li>`;
    case "blockquote":
      return `<blockquote>${inner}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${inner}</code></pre>`;
    case "horizontalRule":
      return "<hr>";
    default:
      return inner;
  }
}

/**
 * Converts a Tiptap JSON document to an HTML string.
 * Pure TypeScript – no @tiptap packages required.
 */
export function tiptapDocToHtml(doc: TiptapDoc): string {
  return (doc.content ?? []).map(renderNode).join("");
}
