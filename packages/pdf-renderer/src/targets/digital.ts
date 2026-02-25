export const digitalPdfTargetConfig = {
  name: "DIGITAL_PDF" as const,
  imageMinPixels: 1200 * 800,
  safeAreaInsetMultiplier: 1,
  showBleedGuide: false,
  printBackground: true,
  pdfScale: 0.95,
  imageQuality: "medium" as const
};
