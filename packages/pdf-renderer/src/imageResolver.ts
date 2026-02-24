import type { ExportTarget, PdfRenderContract, PdfRenderFrame, PdfRenderWarning } from "./contracts";

export type ResolvedFrameImage = {
  src: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
};

const targetMinPixels: Record<ExportTarget, number> = {
  DIGITAL_PDF: 1200 * 800,
  HARDCOPY_PRINT_PDF: 2400 * 1600
};

export function resolveFrameImage(
  contract: PdfRenderContract,
  frame: PdfRenderFrame
): { image: ResolvedFrameImage; warnings: PdfRenderWarning[] } {
  const warnings: PdfRenderWarning[] = [];
  const assetRef = typeof frame.content.assetId === "string" ? frame.content.assetId : null;
  const placeholderDataUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#efe6d0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#5b513c" font-family="Arial" font-size="42">Image Placeholder</text></svg>`
    );

  if (!assetRef) {
    warnings.push({
      code: "IMAGE_MISSING",
      pageId: frame.pageId,
      frameId: frame.id,
      message: "No image asset connected to this image frame. Using placeholder.",
      severity: "info"
    });
    return {
      image: { src: placeholderDataUrl, width: 1200, height: 800, mimeType: "image/svg+xml" },
      warnings
    };
  }

  const asset = contract.assets.find((item) => item.id === assetRef);
  if (!asset?.sourceUrl) {
    warnings.push({
      code: "IMAGE_MISSING",
      pageId: frame.pageId,
      frameId: frame.id,
      message: "Referenced image asset is missing a source URL. Using placeholder.",
      severity: "warning"
    });
    return {
      image: { src: placeholderDataUrl, width: 1200, height: 800, mimeType: "image/svg+xml" },
      warnings
    };
  }

  const pixelCount = (asset.width ?? 0) * (asset.height ?? 0);
  if (pixelCount > 0 && pixelCount < targetMinPixels[contract.exportTarget]) {
    warnings.push({
      code: "LOW_RES_IMAGE",
      pageId: frame.pageId,
      frameId: frame.id,
      message: `Image may be low resolution for ${contract.exportTarget}.`,
      severity: "warning"
    });
  }

  return {
    image: {
      src: asset.sourceUrl,
      width: asset.width ?? null,
      height: asset.height ?? null,
      mimeType: asset.mimeType ?? null
    },
    warnings
  };
}

