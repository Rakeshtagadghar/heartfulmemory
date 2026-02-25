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
  const imageRef =
    frame.type === "FRAME" && frame.content.imageRef && typeof frame.content.imageRef === "object"
      ? (frame.content.imageRef as Record<string, unknown>)
      : null;
  const assetRef =
    frame.type === "IMAGE"
      ? (typeof frame.content.assetId === "string" ? frame.content.assetId : null)
      : typeof imageRef?.assetId === "string"
        ? imageRef.assetId
        : null;
  const directSourceUrl =
    frame.type === "IMAGE"
      ? (typeof frame.content.sourceUrl === "string" ? frame.content.sourceUrl : null)
      : typeof imageRef?.sourceUrl === "string"
        ? imageRef.sourceUrl
        : typeof imageRef?.previewUrl === "string"
          ? imageRef.previewUrl
          : null;
  const placeholderDataUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#efe6d0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#5b513c" font-family="Arial" font-size="42">Image Placeholder</text></svg>`
    );

  if (!assetRef && !directSourceUrl) {
    warnings.push({
      code: "IMAGE_MISSING",
      pageId: frame.pageId,
      frameId: frame.id,
      message: "No image asset connected to this frame. Using placeholder.",
      severity: "info"
    });
    return {
      image: { src: placeholderDataUrl, width: 1200, height: 800, mimeType: "image/svg+xml" },
      warnings
    };
  }

  const asset = assetRef ? contract.assets.find((item) => item.id === assetRef) : undefined;
  if (assetRef && !asset?.sourceUrl && !directSourceUrl) {
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

  if (asset) {
    const assetSource = typeof asset.source === "string" ? asset.source : null;
    const assetLicense =
      asset.license && typeof asset.license === "object" && !Array.isArray(asset.license)
        ? (asset.license as Record<string, unknown>)
        : null;
    const isUpload = assetSource === "UPLOAD";
    if (!isUpload && !assetLicense) {
      warnings.push({
        code: "LICENSE_MISSING",
        pageId: frame.pageId,
        frameId: frame.id,
        message: "Stock image license metadata is missing. Export should be blocked.",
        severity: "warning"
      });
    } else if (!isUpload && assetLicense) {
      const requiresAttribution = assetLicense.requiresAttribution === true;
      if (requiresAttribution) {
        warnings.push({
          code: "ATTRIBUTION_REQUIRED",
          pageId: frame.pageId,
          frameId: frame.id,
          message: "Stock image requires attribution. Include credits before distribution.",
          severity: "info"
        });
      }
    }
  }

  const pixelCount = (asset?.width ?? 0) * (asset?.height ?? 0);
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
      src: directSourceUrl ?? asset?.sourceUrl ?? null,
      width: asset?.width ?? null,
      height: asset?.height ?? null,
      mimeType: asset?.mimeType ?? null
    },
    warnings
  };
}
