import type { PdfRenderContract, PdfRenderOutput } from "../../pdf-renderer/src/contracts";
import { renderWithPlaywright } from "../../pdf-renderer/src/renderWithPlaywright";

export type PdfEngineKind = "playwright";

export type PdfEngineSelection = {
  kind: PdfEngineKind;
  label: "Playwright (HTML->PDF)";
  rationale: string;
};

export const PDF_ENGINE_V1: PdfEngineSelection = {
  kind: "playwright",
  label: "Playwright (HTML->PDF)",
  rationale:
    "Chosen for Sprint 16 v1 to maximize typography/layout parity with the Studio canvas and reuse the existing HTML export renderer."
};

export type CreatePdfDocumentInput = {
  contract: PdfRenderContract;
  exportHash: string;
  debug?: {
    enabled?: boolean;
    showSafeArea?: boolean;
    showBleed?: boolean;
    showNodeBounds?: boolean;
    showNodeIds?: boolean;
  };
};

export async function createPdfDocument(input: CreatePdfDocumentInput): Promise<PdfRenderOutput> {
  return renderWithPlaywright(input.contract, input.exportHash, {
    debug: input.debug?.enabled
      ? {
          showSafeArea: input.debug.showSafeArea,
          showBleed: input.debug.showBleed,
          showNodeBounds: input.debug.showNodeBounds,
          showNodeIds: input.debug.showNodeIds
        }
      : undefined
  });
}
