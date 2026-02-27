import { canExportTarget } from "../../packages/shared/billing/entitlementRules";
import type { BillingEntitlements } from "../../packages/shared/billing/entitlements";

export type ExportGuardDecision = {
  allowed: true;
} | {
  allowed: false;
  code: "EXPORT_PLAN_UPGRADE_REQUIRED";
};

export function evaluateExportAccess(
  entitlements: BillingEntitlements,
  target: "DIGITAL_PDF" | "HARDCOPY_PRINT_PDF"
): ExportGuardDecision {
  if (canExportTarget(entitlements, target) && ((entitlements.exportsRemaining ?? 1) > 0)) {
    return { allowed: true };
  }
  return { allowed: false, code: "EXPORT_PLAN_UPGRADE_REQUIRED" };
}
