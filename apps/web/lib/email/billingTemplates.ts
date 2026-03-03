import { logError } from "../server-log";
import { renderEmail } from "./renderEmail";
import { validateTemplateVars } from "./validateTemplateVars";

type BillingTemplateInput = {
  recipientEmail: string;
  appName?: string;
  supportUrl: string;
  logoUrl?: string;
};

type SubscriptionActiveInput = BillingTemplateInput & {
  userName?: string;
  planName: string;
  manageBillingUrl: string;
};

type PaymentFailedInput = BillingTemplateInput & {
  userName?: string;
  retryDate: string;
  manageBillingUrl: string;
};

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function getLogoUrl(inputLogoUrl?: string) {
  return (
    inputLogoUrl ||
    process.env.EMAIL_LOGO_URL ||
    `${getSiteUrl()}/branding/memorioso-email-logo.png`
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createFallbackEmail(
  subject: string,
  line1: string,
  line2: string,
  actionUrl: string,
) {
  const safeLine1 = escapeHtml(line1);
  const safeLine2 = escapeHtml(line2);
  const safeActionUrl = escapeHtml(actionUrl);

  return {
    subject,
    html: [
      "<!doctype html>",
      "<html>",
      '<body style="font-family:Arial,sans-serif;line-height:1.6;padding:24px;">',
      `<h1 style=\"font-size:24px;margin-bottom:12px;\">${escapeHtml(subject)}</h1>`,
      `<p>${safeLine1}</p>`,
      `<p>${safeLine2}</p>`,
      `<p><a href=\"${safeActionUrl}\">${safeActionUrl}</a></p>`,
      "</body>",
      "</html>",
    ].join(""),
    text: [subject, "", line1, line2, actionUrl].join("\n"),
  };
}

async function renderOrFallback(args: {
  templateId: "subscription_active" | "payment_failed";
  vars: Record<string, unknown>;
  fallbackSubject: string;
  fallbackLine1: string;
  fallbackLine2: string;
  fallbackActionUrl: string;
}) {
  try {
    const validation = validateTemplateVars(args.templateId, args.vars);
    if (!validation.ok) {
      logError("email_template_vars_invalid", {
        templateId: validation.templateId,
        missingVarNames: validation.missingVarNames,
      });

      return createFallbackEmail(
        args.fallbackSubject,
        args.fallbackLine1,
        args.fallbackLine2,
        args.fallbackActionUrl,
      );
    }

    return await renderEmail(args.templateId, validation.data);
  } catch (error) {
    logError("email_template_render_failed", {
      templateId: args.templateId,
      message: error instanceof Error ? error.message : String(error),
    });

    return createFallbackEmail(
      args.fallbackSubject,
      args.fallbackLine1,
      args.fallbackLine2,
      args.fallbackActionUrl,
    );
  }
}

export async function buildSubscriptionActiveTemplate(
  input: SubscriptionActiveInput,
) {
  const appName = input.appName || "Memorioso";
  const rendered = await renderOrFallback({
    templateId: "subscription_active",
    vars: {
      userName: input.userName,
      planName: input.planName,
      manageBillingUrl: input.manageBillingUrl,
      supportUrl: input.supportUrl,
      appName,
      logoUrl: getLogoUrl(input.logoUrl),
    },
    fallbackSubject: `You're on ${appName} Pro`,
    fallbackLine1: `Your ${input.planName} plan is active.`,
    fallbackLine2: "You can manage billing from your account.",
    fallbackActionUrl: input.manageBillingUrl,
  });

  return {
    to: input.recipientEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  };
}

export async function buildPaymentFailedTemplate(input: PaymentFailedInput) {
  const appName = input.appName || "Memorioso";
  const rendered = await renderOrFallback({
    templateId: "payment_failed",
    vars: {
      userName: input.userName,
      manageBillingUrl: input.manageBillingUrl,
      retryDate: input.retryDate,
      supportUrl: input.supportUrl,
      appName,
      logoUrl: getLogoUrl(input.logoUrl),
    },
    fallbackSubject: `Payment failed - action needed for ${appName}`,
    fallbackLine1: "We could not process your latest payment.",
    fallbackLine2: `Please update billing before ${input.retryDate}.`,
    fallbackActionUrl: input.manageBillingUrl,
  });

  return {
    to: input.recipientEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  };
}
