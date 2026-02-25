import type { PdfRenderContract } from "../../../pdf-renderer/src/contracts";
import { finalizeIssues, type ExportValidationIssue } from "../types";
import { normalizeStorybookExportSettingsV1 } from "../../../shared-schema/storybookSettings.types";

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

function safeAreaForPage(
  page: PdfRenderContract["pages"][number],
  safePadding: number
) {
  return {
    left: page.margins.left + safePadding,
    top: page.margins.top + safePadding,
    right: page.widthPx - page.margins.right - safePadding,
    bottom: page.heightPx - page.margins.bottom - safePadding
  };
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

export function validateHardcopyExport(contract: PdfRenderContract) {
  const issues: ExportValidationIssue[] = [];
  const pageById = new Map(contract.pages.map((page) => [page.id, page] as const));
  const assetById = new Map(contract.assets.map((asset) => [asset.id, asset] as const));
  const settings = normalizeStorybookExportSettingsV1(contract.storybook.settings);

  for (const frame of contract.frames) {
    const page = pageById.get(frame.pageId);
    if (!page) continue;
    const safe = safeAreaForPage(page, settings.printPreset.safeAreaPadding);

    const frameLeft = frame.x;
    const frameTop = frame.y;
    const frameRight = frame.x + frame.w;
    const frameBottom = frame.y + frame.h;

    if (frameLeft < 0 || frameTop < 0 || frameRight > page.widthPx || frameBottom > page.heightPx) {
      issues.push({
        code: "PRINT_FRAME_OUTSIDE_PAGE",
        target: "HARDCOPY_PRINT_PDF",
        severity: "error",
        blocking: true,
        pageId: page.id,
        frameId: frame.id,
        path: { pageId: page.id, frameId: frame.id },
        message: "Frame extends beyond the printable page."
      });
    }

    if (frame.type === "TEXT") {
      if (
        frameLeft < safe.left ||
        frameTop < safe.top ||
        frameRight > safe.right ||
        frameBottom > safe.bottom
      ) {
        issues.push({
          code: "PRINT_TEXT_OUTSIDE_SAFE_AREA",
          target: "HARDCOPY_PRINT_PDF",
          severity: "error",
          blocking: true,
          pageId: page.id,
          frameId: frame.id,
          path: { pageId: page.id, frameId: frame.id },
          message: "Text frame is outside the hardcopy safe area."
        });
      }
      if (estimateTextOverflow(frame)) {
        issues.push({
          code: "TEXT_OVERFLOW",
          target: "HARDCOPY_PRINT_PDF",
          severity: "warning",
          blocking: false,
          pageId: page.id,
          frameId: frame.id,
          path: { pageId: page.id, frameId: frame.id },
          message: "Text may overflow in print output."
        });
      }
    }

    if (frame.type === "IMAGE" || frame.type === "FRAME") {
      const assetId = getReferencedAssetId(frame);
      const asset = assetId ? assetById.get(assetId) : null;
      if (!asset) continue;
      const width = typeof asset.width === "number" ? asset.width : 0;
      if (width > 0 && width < settings.printPreset.minImageWidthPx) {
        const isSevere = width < settings.printPreset.minImageWidthPx * 0.6;
        issues.push({
          code: "PRINT_LOW_RES_IMAGE",
          target: "HARDCOPY_PRINT_PDF",
          severity: isSevere ? "error" : "warning",
          blocking: isSevere,
          pageId: page.id,
          frameId: frame.id,
          path: { pageId: page.id, frameId: frame.id },
          message: isSevere
            ? "Image is too low-resolution for hardcopy export."
            : "Image may print soft in hardcopy export."
        });
      }
    }
  }

  return finalizeIssues(issues);
}
