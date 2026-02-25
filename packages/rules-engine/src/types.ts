import type { PdfRenderContract } from "../../pdf-renderer/src/contracts";

export type ExportIssueCode =
  | "PRINT_TEXT_OUTSIDE_SAFE_AREA"
  | "PRINT_FRAME_OUTSIDE_PAGE"
  | "PRINT_LOW_RES_IMAGE"
  | "TEXT_OVERFLOW"
  | "FRAME_OVERLAP"
  | "LICENSE_MISSING";

export type ExportValidationIssue = {
  code: ExportIssueCode;
  target: PdfRenderContract["exportTarget"];
  severity: "warning" | "error";
  blocking: boolean;
  pageId: string;
  frameId?: string;
  path: {
    pageId: string;
    frameId?: string;
  };
  message: string;
};

export type ExportValidationResult = {
  ok: boolean;
  issues: ExportValidationIssue[];
  blockingIssues: ExportValidationIssue[];
  warnings: ExportValidationIssue[];
};

export type ValidateContractInput = {
  contract: PdfRenderContract;
};

export function finalizeIssues(
  issues: ExportValidationIssue[]
): ExportValidationResult {
  const blockingIssues = issues.filter((issue) => issue.blocking);
  const warnings = issues.filter((issue) => !issue.blocking);
  return {
    ok: blockingIssues.length === 0,
    issues,
    blockingIssues,
    warnings
  };
}
