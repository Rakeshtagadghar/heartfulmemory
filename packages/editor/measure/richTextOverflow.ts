/**
 * DOM-based overflow measurement for Studio rich text nodes.
 * Measures whether the rendered text content exceeds the frame's height.
 *
 * Usage: call measureRichTextOverflow after committing an edit.
 * Avoids heavy reflow loops by measuring only on explicit commit.
 */

type OverflowResult = {
  overflow: boolean;
  /** Content height in px */
  contentHeight: number;
  /** Frame height in px */
  frameHeight: number;
};

/**
 * Measures whether rich HTML content overflows a given frame size.
 * Creates a temporary off-screen element to measure rendered height.
 *
 * @param html  Sanitized HTML string from tiptapDocToHtml
 * @param frameWidth  Frame width in pixels
 * @param frameHeight Frame height in pixels
 * @param styleCss    Inline CSS string matching the frame's text styling
 */
export function measureRichTextOverflow(
  html: string,
  frameWidth: number,
  frameHeight: number,
  styleCss?: string
): OverflowResult {
  // Create a hidden measuring container
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText = [
    "position:fixed",
    "top:-9999px",
    "left:-9999px",
    `width:${frameWidth}px`,
    "height:auto",
    "overflow:hidden",
    "visibility:hidden",
    "pointer-events:none",
    styleCss ?? ""
  ].join(";");

  container.innerHTML = html;
  document.body.appendChild(container);

  const contentHeight = container.scrollHeight;
  document.body.removeChild(container);

  return {
    overflow: contentHeight > frameHeight,
    contentHeight,
    frameHeight
  };
}
