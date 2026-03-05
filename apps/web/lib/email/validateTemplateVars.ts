import {
  TemplateValidationError,
  validateAuthTemplateVars,
  validateBillingTemplateVars,
  type AuthTemplateId,
  type BillingTemplateId
} from "@memorioso/emails";

export type TemplateValidationResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      code: "TEMPLATE_VARS_INVALID";
      templateId: string;
      missingVarNames: string[];
    };

function isAuthTemplateId(templateId: string): templateId is AuthTemplateId {
  return ["verify_email", "login_code_or_magic_link", "reset_password", "password_set_success"].includes(templateId);
}

function isBillingTemplateId(templateId: string): templateId is BillingTemplateId {
  return ["subscription_active", "payment_failed"].includes(templateId);
}

export function validateTemplateVars(templateId: string, vars: unknown): TemplateValidationResult {
  try {
    if (isAuthTemplateId(templateId)) {
      return { ok: true, data: validateAuthTemplateVars(templateId, vars) };
    }

    if (isBillingTemplateId(templateId)) {
      return { ok: true, data: validateBillingTemplateVars(templateId, vars) };
    }

    return {
      ok: false,
      code: "TEMPLATE_VARS_INVALID",
      templateId,
      missingVarNames: ["templateId"]
    };
  } catch (error) {
    if (error instanceof TemplateValidationError) {
      return {
        ok: false,
        code: error.code,
        templateId: error.templateId,
        missingVarNames: error.missingVarNames
      };
    }

    return {
      ok: false,
      code: "TEMPLATE_VARS_INVALID",
      templateId,
      missingVarNames: []
    };
  }
}
