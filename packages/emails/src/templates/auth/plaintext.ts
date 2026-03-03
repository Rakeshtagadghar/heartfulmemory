import type {
  LoginLinkOrCodeVars,
  ResetPasswordVars,
  VerifyEmailVars
} from "../../contracts/auth";

function getGreeting(name?: string) {
  if (!name) return "Hello,";
  return `Hello ${name},`;
}

export function verifyEmailPlainText(vars: VerifyEmailVars) {
  return [
    getGreeting(vars.userName),
    "",
    "Please verify your email address for Memorioso.",
    `Verify link: ${vars.verifyUrl}`,
    `This link expires in ${vars.expiryMinutes} minutes.`,
    "",
    "If you did not request this, you can ignore this email.",
    `Support: ${vars.supportUrl}`
  ].join("\n");
}

export function loginLinkOrCodePlainText(vars: LoginLinkOrCodeVars) {
  const lines = [
    getGreeting(vars.userName),
    "",
    "Use this secure link to sign in:",
    vars.loginUrl,
    `This link expires in ${vars.expiryMinutes} minutes.`
  ];

  if (vars.code) {
    lines.push("", `Or use code: ${vars.code}`);
  }

  lines.push(
    "",
    "If you did not request this, you can ignore this email.",
    `Support: ${vars.supportUrl}`
  );

  return lines.join("\n");
}

export function resetPasswordPlainText(vars: ResetPasswordVars) {
  return [
    getGreeting(vars.userName),
    "",
    "Use this secure link to reset your password:",
    vars.resetUrl,
    `This link expires in ${vars.expiryMinutes} minutes.`,
    "",
    "If you did not request this, you can ignore this email.",
    `Support: ${vars.supportUrl}`
  ].join("\n");
}
