type AuthTemplateInput = {
  appName?: string;
  recipientEmail: string;
  actionUrl: string;
};

function getAppName(inputName?: string) {
  return inputName || "Memorioso";
}

function createBaseHtml(title: string, bodyLines: string[], ctaLabel: string, actionUrl: string, appName: string) {
  const bodyHtml = bodyLines.map((line) => `<p style=\"margin:0 0 12px;color:#1f2937;line-height:1.6;\">${line}</p>`).join("");

  return [
    "<!doctype html>",
    "<html>",
    "<body style=\"margin:0;padding:24px;background:#f4f1ea;font-family:Georgia,serif;\">",
    "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">",
    "    <tr>",
    "      <td align=\"center\">",
    "        <table role=\"presentation\" width=\"100%\" style=\"max-width:600px;background:#ffffff;border:1px solid #e5dcc8;border-radius:12px;padding:28px;\">",
    `          <tr><td><p style=\"margin:0 0 10px;font-size:12px;letter-spacing:0.08em;color:#846400;text-transform:uppercase;\">${appName}</p></td></tr>`,
    `          <tr><td><h1 style=\"margin:0 0 14px;color:#0f172a;font-size:28px;line-height:1.2;\">${title}</h1></td></tr>`,
    `          <tr><td>${bodyHtml}</td></tr>`,
    `          <tr><td style=\"padding-top:10px;\"><a href=\"${actionUrl}\" style=\"display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;\">${ctaLabel}</a></td></tr>`,
    `          <tr><td><p style=\"margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;\">If this was not you, you can ignore this email. Your account remains safe.</p></td></tr>`,
    "        </table>",
    "      </td>",
    "    </tr>",
    "  </table>",
    "</body>",
    "</html>"
  ].join("");
}

export function buildPasswordResetTemplate(input: AuthTemplateInput) {
  const appName = getAppName(input.appName);
  const subject = `${appName}: Reset your password`;
  const text = [
    `${appName} password reset`,
    "",
    "We received a request to reset your password.",
    `Use this secure link: ${input.actionUrl}`,
    "",
    "If you did not request this, you can ignore this email."
  ].join("\n");

  const html = createBaseHtml(
    "Reset your password",
    [
      "We received a request to reset your password.",
      "Use the secure button below to choose a new password."
    ],
    "Set new password",
    input.actionUrl,
    appName
  );

  return {
    to: input.recipientEmail,
    subject,
    text,
    html
  };
}

export function buildEmailVerificationTemplate(input: AuthTemplateInput) {
  const appName = getAppName(input.appName);
  const subject = `${appName}: Verify your email`;
  const text = [
    `${appName} email verification`,
    "",
    "Please verify your email to continue.",
    `Use this secure link: ${input.actionUrl}`,
    "",
    "If you did not request this, you can ignore this email."
  ].join("\n");

  const html = createBaseHtml(
    "Verify your email",
    [
      "Please confirm this email address before continuing.",
      "Verification helps keep your account secure."
    ],
    "Verify email",
    input.actionUrl,
    appName
  );

  return {
    to: input.recipientEmail,
    subject,
    text,
    html
  };
}

export function buildEmailSignInTemplate(input: AuthTemplateInput) {
  const appName = getAppName(input.appName);
  const subject = `${appName}: Your secure sign-in link`;
  const text = [
    `${appName} secure sign-in`,
    "",
    "Use this secure link to sign in or continue setting up your account.",
    `Sign-in link: ${input.actionUrl}`,
    "",
    "If you did not request this, you can ignore this email."
  ].join("\n");

  const html = createBaseHtml(
    "Your secure sign-in link",
    [
      "Use the button below to sign in on this device.",
      "This link expires soon for your security."
    ],
    "Sign in securely",
    input.actionUrl,
    appName
  );

  return {
    to: input.recipientEmail,
    subject,
    text,
    html
  };
}
