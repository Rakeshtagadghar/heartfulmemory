import { render } from "@react-email/render";
import { ZodError } from "zod";
import {
  authTemplateIdSchema,
  loginLinkOrCodeVarsSchema,
  resetPasswordVarsSchema,
  verifyEmailVarsSchema,
  type AuthTemplateId,
  type LoginLinkOrCodeVars,
  type ResetPasswordVars,
  type VerifyEmailVars,
} from "./contracts/auth";
import {
  billingTemplateIdSchema,
  paymentFailedVarsSchema,
  subscriptionActiveVarsSchema,
  type BillingTemplateId,
  type PaymentFailedVars,
  type SubscriptionActiveVars,
} from "./contracts/billing";
import { VerifyEmailTemplate } from "./templates/auth/VerifyEmail";
import { LoginLinkOrCodeTemplate } from "./templates/auth/LoginLinkOrCode";
import { ResetPasswordTemplate } from "./templates/auth/ResetPassword";
import {
  loginLinkOrCodePlainText,
  resetPasswordPlainText,
  verifyEmailPlainText,
} from "./templates/auth/plaintext";
import { PaymentFailedTemplate } from "./templates/billing/PaymentFailed";
import { SubscriptionActiveTemplate } from "./templates/billing/SubscriptionActive";
import {
  paymentFailedPlainText,
  subscriptionActivePlainText,
} from "./templates/billing/plaintext";

export type TemplateId = AuthTemplateId | BillingTemplateId;

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export class TemplateValidationError extends Error {
  code = "TEMPLATE_VARS_INVALID" as const;
  templateId: TemplateId;
  missingVarNames: string[];

  constructor(templateId: TemplateId, missingVarNames: string[]) {
    super(`Template variables invalid for ${templateId}`);
    this.templateId = templateId;
    this.missingVarNames = missingVarNames;
  }
}

function getValidationError(templateId: TemplateId, error: unknown) {
  if (!(error instanceof ZodError)) {
    return new TemplateValidationError(templateId, []);
  }

  const missingVarNames = Array.from(
    new Set(error.issues.map((issue) => issue.path.join(".")).filter(Boolean)),
  );
  return new TemplateValidationError(templateId, missingVarNames);
}

function getAuthSubject(templateId: AuthTemplateId, appName?: string) {
  const productName = appName || "Memorioso";
  if (templateId === "verify_email")
    return `Verify your email for ${productName}`;
  if (templateId === "login_code_or_magic_link")
    return `Your ${productName} login link`;
  return `Reset your ${productName} password`;
}

function getBillingSubject(templateId: BillingTemplateId, appName?: string) {
  const productName = appName || "Memorioso";
  if (templateId === "subscription_active")
    return `You're on ${productName} Pro`;
  return `Payment failed - action needed for ${productName}`;
}

export function validateAuthTemplateVars(
  templateId: AuthTemplateId,
  vars: unknown,
): VerifyEmailVars | LoginLinkOrCodeVars | ResetPasswordVars {
  try {
    authTemplateIdSchema.parse(templateId);

    if (templateId === "verify_email") {
      return verifyEmailVarsSchema.parse(vars);
    }

    if (templateId === "login_code_or_magic_link") {
      return loginLinkOrCodeVarsSchema.parse(vars);
    }

    return resetPasswordVarsSchema.parse(vars);
  } catch (error) {
    throw getValidationError(templateId, error);
  }
}

export function validateBillingTemplateVars(
  templateId: BillingTemplateId,
  vars: unknown,
): SubscriptionActiveVars | PaymentFailedVars {
  try {
    billingTemplateIdSchema.parse(templateId);

    if (templateId === "subscription_active") {
      return subscriptionActiveVarsSchema.parse(vars);
    }

    return paymentFailedVarsSchema.parse(vars);
  } catch (error) {
    throw getValidationError(templateId, error);
  }
}

export async function renderAuthEmail(
  templateId: AuthTemplateId,
  vars: VerifyEmailVars | LoginLinkOrCodeVars | ResetPasswordVars,
): Promise<RenderedEmail> {
  if (templateId === "verify_email") {
    const parsed = validateAuthTemplateVars(
      templateId,
      vars,
    ) as VerifyEmailVars;
    return {
      subject: getAuthSubject(templateId, parsed.appName),
      html: await render(<VerifyEmailTemplate {...parsed} />),
      text: verifyEmailPlainText(parsed),
    };
  }

  if (templateId === "login_code_or_magic_link") {
    const parsed = validateAuthTemplateVars(
      templateId,
      vars,
    ) as LoginLinkOrCodeVars;
    return {
      subject: getAuthSubject(templateId, parsed.appName),
      html: await render(<LoginLinkOrCodeTemplate {...parsed} />),
      text: loginLinkOrCodePlainText(parsed),
    };
  }

  const parsed = validateAuthTemplateVars(
    templateId,
    vars,
  ) as ResetPasswordVars;
  return {
    subject: getAuthSubject(templateId, parsed.appName),
    html: await render(<ResetPasswordTemplate {...parsed} />),
    text: resetPasswordPlainText(parsed),
  };
}

export async function renderBillingEmail(
  templateId: BillingTemplateId,
  vars: SubscriptionActiveVars | PaymentFailedVars,
): Promise<RenderedEmail> {
  if (templateId === "subscription_active") {
    const parsed = validateBillingTemplateVars(
      templateId,
      vars,
    ) as SubscriptionActiveVars;
    return {
      subject: getBillingSubject(templateId, parsed.appName),
      html: await render(<SubscriptionActiveTemplate {...parsed} />),
      text: subscriptionActivePlainText(parsed),
    };
  }

  const parsed = validateBillingTemplateVars(
    templateId,
    vars,
  ) as PaymentFailedVars;
  return {
    subject: getBillingSubject(templateId, parsed.appName),
    html: await render(<PaymentFailedTemplate {...parsed} />),
    text: paymentFailedPlainText(parsed),
  };
}

export async function renderEmail(
  templateId: TemplateId,
  vars: unknown,
): Promise<RenderedEmail> {
  if (templateId === "verify_email") {
    const parsed = validateAuthTemplateVars(
      templateId,
      vars,
    ) as VerifyEmailVars;
    return renderAuthEmail(templateId, parsed);
  }

  if (templateId === "login_code_or_magic_link") {
    const parsed = validateAuthTemplateVars(
      templateId,
      vars,
    ) as LoginLinkOrCodeVars;
    return renderAuthEmail(templateId, parsed);
  }

  if (templateId === "reset_password") {
    const parsed = validateAuthTemplateVars(
      templateId,
      vars,
    ) as ResetPasswordVars;
    return renderAuthEmail(templateId, parsed);
  }

  if (templateId === "subscription_active") {
    const parsed = validateBillingTemplateVars(
      templateId,
      vars,
    ) as SubscriptionActiveVars;
    return renderBillingEmail(templateId, parsed);
  }

  const parsed = validateBillingTemplateVars(
    templateId,
    vars,
  ) as PaymentFailedVars;
  return renderBillingEmail(templateId, parsed);
}
