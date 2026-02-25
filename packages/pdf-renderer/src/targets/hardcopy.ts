export const hardcopyPdfTargetConfig = {
  name: "HARDCOPY_PRINT_PDF" as const,
  imageMinPixels: 2400 * 1600,
  safeAreaInsetMultiplier: 1.25,
  showBleedGuide: true,
  printBackground: true,
  pdfScale: 1,
  imageQuality: "high" as const
};
