import type { PdfRenderContract } from "../../../pdf-renderer/src/contracts";
import { finalizeIssues, type ExportValidationIssue } from "../types";

function getReferencedAssetId(frame: PdfRenderContract["frames"][number]) {
  if (frame.type === "IMAGE") {
    return typeof frame.content.assetId === "string" ? frame.content.assetId : null;
  }
  if (frame.type === "FRAME") {
    const imageRef =
      frame.content.imageRef && typeof frame.content.imageRef === "object"
        ? (frame.content.imageRef as Record<string, unknown>)
        : null;
    return typeof imageRef?.assetId === "string" ? imageRef.assetId : null;
  }
  return null;
}

function estimateTextOverflow(frame: PdfRenderContract["frames"][number]) {
  if (frame.type !== "TEXT") return false;
  const text = typeof frame.content.text === "string" ? frame.content.text : "";
  const fontSize = typeof frame.style.fontSize === "number" ? frame.style.fontSize : 15;
  const lineHeight = typeof frame.style.lineHeight === "number" ? frame.style.lineHeight : 1.45;
  const approxCharsPerLine = Math.max(8, Math.floor(frame.w / Math.max(8, fontSize * 0.55)));
  const approxLines = Math.ceil(Math.max(1, text.length) / approxCharsPerLine);
  const maxLines = Math.max(1, Math.floor(frame.h / Math.max(10, fontSize * lineHeight)));
  return approxLines > maxLines;
}

export function validateDigitalExport(contract: PdfRenderContract) {
  const issues: ExportValidationIssue[] = [];
  const pageById = new Map(contract.pages.map((page) => [page.id, page] as const));
  const assetById = new Map(contract.assets.map((asset) => [asset.id, asset] as const));

  for (const frame of contract.frames) {
    const page = pageById.get(frame.pageId);
    if (!page) continue;

    if (frame.x < 0 || frame.y < 0 || frame.x + frame.w > page.widthPx || frame.y + frame.h > page.heightPx) {
      issues.push({
        code: "PRINT_FRAME_OUTSIDE_PAGE",
        target: "DIGITAL_PDF",
        severity: "warning",
        blocking: false,
        pageId: page.id,
        frameId: frame.id,
        path: { pageId: page.id, frameId: frame.id },
        message: "Frame extends beyond page bounds."
      });
    }

    if (estimateTextOverflow(frame)) {
      issues.push({
        code: "TEXT_OVERFLOW",
        target: "DIGITAL_PDF",
        severity: "warning",
        blocking: false,
        pageId: page.id,
        frameId: frame.id,
        path: { pageId: page.id, frameId: frame.id },
        message: "Text may overflow this frame in digital PDF."
      });
    }

    if (frame.type === "IMAGE" || frame.type === "FRAME") {
      const assetId = getReferencedAssetId(frame);
      const asset = assetId ? assetById.get(assetId) : null;
      if (!asset) continue;
      const width = typeof asset.width === "number" ? asset.width : 0;
      if (width > 0 && width < 1200) {
        issues.push({
          code: "PRINT_LOW_RES_IMAGE",
          target: "DIGITAL_PDF",
          severity: "warning",
          blocking: false,
          pageId: page.id,
          frameId: frame.id,
          path: { pageId: page.id, frameId: frame.id },
          message: "Image may look soft in digital PDF."
        });
      }
    }
  }

  return finalizeIssues(issues);
}
