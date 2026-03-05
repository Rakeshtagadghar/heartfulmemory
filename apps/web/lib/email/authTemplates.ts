import { logError } from "../server-log";
import { renderEmail } from "./renderEmail";
import { validateTemplateVars } from "./validateTemplateVars";
import { SUPPORT_CONTACT_PATH } from "../support/contact";

type AuthTemplateInput = {
  appName?: string;
  recipientEmail: string;
  actionUrl: string;
};

type PasswordSetSuccessInput = {
  appName?: string;
  recipientEmail: string;
  securityUrl: string;
  userName?: string;
};

const AUTH_EXPIRY_MINUTES = {
  verifyEmail: 24 * 60,
  signInLink: 20,
  resetPassword: 30,
} as const;

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function getSupportUrl() {
  return process.env.EMAIL_SUPPORT_URL || `${getSiteUrl()}${SUPPORT_CONTACT_PATH}`;
}

function getLogoUrl() {
  return (
    process.env.EMAIL_LOGO_URL ||
    `${getSiteUrl()}/branding/memorioso-email-logo.png`
  );
}

function getAppName(inputName?: string) {
  return inputName || "Memorioso";
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
      "<p>If you did not request this, you can ignore this email.</p>",
      "</body>",
      "</html>",
    ].join(""),
    text: [
      subject,
      "",
      line1,
      line2,
      actionUrl,
      "",
      "If you did not request this, ignore this email.",
    ].join("\n"),
  };
}

async function renderOrFallback(args: {
  templateId: "verify_email" | "login_code_or_magic_link" | "reset_password" | "password_set_success";
  vars:
    | {
        userName?: string;
        verifyUrl: string;
        expiryMinutes: number;
        supportUrl: string;
        appName?: string;
        logoUrl?: string;
      }
    | {
        userName?: string;
        loginUrl: string;
        code?: string;
        expiryMinutes: number;
        supportUrl: string;
        appName?: string;
        logoUrl?: string;
      }
    | {
        userName?: string;
        resetUrl: string;
        expiryMinutes: number;
        supportUrl: string;
        appName?: string;
        logoUrl?: string;
      }
    | {
        userName?: string;
        securityUrl: string;
        supportUrl: string;
        appName?: string;
        logoUrl?: string;
      };
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

export async function buildPasswordResetTemplate(input: AuthTemplateInput) {
  const appName = getAppName(input.appName);
  const rendered = await renderOrFallback({
    templateId: "reset_password",
    vars: {
      appName,
      userName: undefined,
      resetUrl: input.actionUrl,
      expiryMinutes: AUTH_EXPIRY_MINUTES.resetPassword,
      supportUrl: getSupportUrl(),
      logoUrl: getLogoUrl(),
    },
    fallbackSubject: `${appName}: Reset your password`,
    fallbackLine1: "We received a request to reset your password.",
    fallbackLine2: "Use this secure link to choose a new password.",
    fallbackActionUrl: input.actionUrl,
  });

  return {
    to: input.recipientEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  };
}

export async function buildEmailVerificationTemplate(input: AuthTemplateInput) {
  const appName = getAppName(input.appName);
  const rendered = await renderOrFallback({
    templateId: "verify_email",
    vars: {
      appName,
      userName: undefined,
      verifyUrl: input.actionUrl,
      expiryMinutes: AUTH_EXPIRY_MINUTES.verifyEmail,
      supportUrl: getSupportUrl(),
      logoUrl: getLogoUrl(),
    },
    fallbackSubject: `${appName}: Verify your email`,
    fallbackLine1: "Please verify your email to continue.",
    fallbackLine2: "Use this secure link to verify your address.",
    fallbackActionUrl: input.actionUrl,
  });

  return {
    to: input.recipientEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  };
}

export async function buildEmailSignInTemplate(input: AuthTemplateInput) {
  const appName = getAppName(input.appName);
  const rendered = await renderOrFallback({
    templateId: "login_code_or_magic_link",
    vars: {
      appName,
      userName: undefined,
      loginUrl: input.actionUrl,
      expiryMinutes: AUTH_EXPIRY_MINUTES.signInLink,
      supportUrl: getSupportUrl(),
      logoUrl: getLogoUrl(),
    },
    fallbackSubject: `${appName}: Your secure sign-in link`,
    fallbackLine1: "Use this secure link to sign in.",
    fallbackLine2: "This link expires shortly for your security.",
    fallbackActionUrl: input.actionUrl,
  });

  return {
    to: input.recipientEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  };
}

export async function buildPasswordSetSuccessTemplate(input: PasswordSetSuccessInput) {
  const appName = getAppName(input.appName);
  const rendered = await renderOrFallback({
    templateId: "password_set_success",
    vars: {
      appName,
      userName: input.userName,
      securityUrl: input.securityUrl,
      supportUrl: getSupportUrl(),
      logoUrl: getLogoUrl(),
    },
    fallbackSubject: `${appName}: Your password is set`,
    fallbackLine1: "Your password has been set successfully.",
    fallbackLine2: "If this was not you, contact support immediately.",
    fallbackActionUrl: input.securityUrl,
  });

  return {
    to: input.recipientEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  };
}
