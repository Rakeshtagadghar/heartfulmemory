import { canExportTarget } from "../../packages/shared/billing/entitlementRules";
import type { BillingEntitlements } from "../../packages/shared/billing/entitlements";

export type ExportGuardDecision = {
  allowed: true;
} | {
  allowed: false;
  code: "EXPORT_PLAN_UPGRADE_REQUIRED" | "EXPORT_QUOTA_EXCEEDED";
};

export function evaluateExportAccess(
  entitlements: BillingEntitlements,
  target: "DIGITAL_PDF" | "HARDCOPY_PRINT_PDF"
): ExportGuardDecision {
  if (!canExportTarget(entitlements, target)) return { allowed: false, code: "EXPORT_PLAN_UPGRADE_REQUIRED" };
  if (entitlements.exportsRemaining !== null && entitlements.exportsRemaining <= 0) {
    return { allowed: false, code: "EXPORT_QUOTA_EXCEEDED" };
  }
  return { allowed: true };
}
