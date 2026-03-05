export const SET_PASSWORD_ROUTE = "/account/set-password";
export const AUTH_POST_LOGIN_ROUTE = "/auth/post-login";
export const SET_PASSWORD_SKIP_COOKIE = "memorioso_set_password_skip_until";

export type SetPasswordPolicy = {
  promptAfterPasswordlessLogin: boolean;
  allowSkip: boolean;
  skipWindowDays: number;
  requiredForExport: boolean;
  requiredForBilling: boolean;
  sensitiveRoutePrefixes: readonly string[];
};

export const setPasswordPolicy: SetPasswordPolicy = {
  // Sprint 38 v1: gentle default for elder usability.
  promptAfterPasswordlessLogin: true,
  allowSkip: true,
  skipWindowDays: 30,
  requiredForExport: true,
  requiredForBilling: false,
  sensitiveRoutePrefixes: ["/api/export", "/app/account/billing"]
};

export function getSetPasswordSkipWindowMs(policy: SetPasswordPolicy = setPasswordPolicy) {
  return policy.skipWindowDays * 24 * 60 * 60 * 1000;
}

