/**
 * Sprint 36 auth method config (planning contract).
 *
 * This file intentionally keeps provider decisions centralized so Convex Auth
 * runtime wiring can be completed in Sprint 36 phase 2 without changing
 * downstream auth UX/routes again.
 */

export type AuthMethodId = "password" | "email_otp" | "magic_link" | "google";

export type AuthMethodConfig = {
  enabled: boolean;
  default?: boolean;
};

export const authMethodConfig: Record<AuthMethodId, AuthMethodConfig> = {
  password: { enabled: true },
  email_otp: { enabled: true, default: true },
  magic_link: { enabled: true },
  google: { enabled: true }
};

export function isAuthMethodEnabled(method: AuthMethodId) {
  return authMethodConfig[method].enabled;
}

export function getDefaultEmailMethod(): "email_otp" | "magic_link" {
  if (authMethodConfig.email_otp.default && authMethodConfig.email_otp.enabled) {
    return "email_otp";
  }
  return "magic_link";
}

