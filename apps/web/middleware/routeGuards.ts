import {
  AUTH_POST_LOGIN_ROUTE,
  SET_PASSWORD_ROUTE,
  type SetPasswordPolicy,
  setPasswordPolicy
} from "../lib/config/setPasswordPolicy";

type PasswordRouteGuardInput = {
  pathname: string;
  hasPassword: boolean;
  skipUntilMs?: number | null;
  nowMs?: number;
  policy?: SetPasswordPolicy;
};

function isSetPasswordFlowPath(pathname: string) {
  return pathname === SET_PASSWORD_ROUTE || pathname.startsWith(`${SET_PASSWORD_ROUTE}/`);
}

function isPostLoginPath(pathname: string) {
  return pathname === AUTH_POST_LOGIN_ROUTE || pathname.startsWith(`${AUTH_POST_LOGIN_ROUTE}/`);
}

export function shouldPromptSetPasswordAfterLogin(input: PasswordRouteGuardInput) {
  const policy = input.policy || setPasswordPolicy;
  if (!policy.promptAfterPasswordlessLogin) return false;
  if (input.hasPassword) return false;
  if (isSetPasswordFlowPath(input.pathname)) return false;
  if (isPostLoginPath(input.pathname)) return false;

  if (!policy.allowSkip) return true;
  const nowMs = input.nowMs ?? Date.now();
  if (typeof input.skipUntilMs === "number" && input.skipUntilMs > nowMs) {
    return false;
  }

  return true;
}

export function shouldRequirePasswordForSensitiveRoute(input: Omit<PasswordRouteGuardInput, "skipUntilMs" | "nowMs">) {
  const policy = input.policy || setPasswordPolicy;
  if (input.hasPassword) return false;

  const isExportPath =
    input.pathname === "/api/export" ||
    input.pathname.startsWith("/api/export/");
  const isBillingPath =
    input.pathname === "/app/account/billing" ||
    input.pathname.startsWith("/app/account/billing/");

  if (isExportPath && !policy.requiredForExport) return false;
  if (isBillingPath && !policy.requiredForBilling) return false;

  return policy.sensitiveRoutePrefixes.some(
    (prefix) => input.pathname === prefix || input.pathname.startsWith(`${prefix}/`)
  );
}
