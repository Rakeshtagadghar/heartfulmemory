/**
 * Minimal HTML sanitizer for PDF text rendering.
 * Allows safe inline/block formatting tags only.
 * Does not execute scripts or load external resources.
 *
 * Uses a strict allowlist approach – anything not in the list is stripped.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s",
  "a", "code", "pre",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote",
  "span"
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "rel"]),
  span: new Set(["style"])
};

/** Allowed CSS properties inside style="" attributes. */
const ALLOWED_CSS_PROPS = new Set(["color", "font-weight", "font-style", "text-decoration"]);

function sanitizeCssValue(value: string): string {
  // Remove any url(), expression(), or import directives
  if (/url\s*\(|expression\s*\(|@import/i.test(value)) return "";
  return value;
}

function sanitizeStyleAttr(style: string): string {
  return style
    .split(";")
    .map((decl) => {
      const colonIdx = decl.indexOf(":");
      if (colonIdx < 0) return "";
      const prop = decl.slice(0, colonIdx).trim().toLowerCase();
      const val = decl.slice(colonIdx + 1).trim();
      if (!ALLOWED_CSS_PROPS.has(prop)) return "";
      const sanitizedVal = sanitizeCssValue(val);
      return sanitizedVal ? `${prop}:${sanitizedVal}` : "";
    })
    .filter(Boolean)
    .join(";");
}

/**
 * Strip any HTML tags/attributes not in the allowlist.
 * Safe for use in PDF output rendered via Puppeteer/Chromium.
 */
export function sanitizeRichtextHtml(html: string): string {
  // Replace script/style blocks entirely
  let result = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Process remaining tags
  result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (match, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    const isClosing = match.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) return "";

    if (isClosing) return `</${tag}>`;

    const allowedAttrNames = ALLOWED_ATTRS[tag];
    if (!allowedAttrNames) return `<${tag}>`;

    // Parse and filter attributes
    const sanitizedAttrs: string[] = [];
    const attrRegex = /([a-zA-Z][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))|(?=\s|>))/g;
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(attrs)) !== null) {
      const attrName = m[1].toLowerCase();
      const attrValue = m[2] ?? m[3] ?? m[4] ?? "";
      if (!allowedAttrNames.has(attrName)) continue;

      if (attrName === "href") {
        // Only allow http/https/mailto
        if (!/^(https?:|mailto:)/i.test(attrValue.trim())) continue;
        sanitizedAttrs.push(`href="${attrValue.replace(/"/g, "&quot;")}"`);
      } else if (attrName === "style") {
        const safe = sanitizeStyleAttr(attrValue);
        if (safe) sanitizedAttrs.push(`style="${safe}"`);
      } else if (attrName === "rel") {
        sanitizedAttrs.push(`rel="noopener noreferrer"`);
      }
    }

    return sanitizedAttrs.length
      ? `<${tag} ${sanitizedAttrs.join(" ")}>`
      : `<${tag}>`;
  });

  return result;
}
