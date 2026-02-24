"use client";

import { track } from "./client";

type AuthEventProps = Record<string, string | number | boolean | null | undefined>;

export function trackAuthViewLogin(props?: AuthEventProps) {
  track("auth_view_login", props);
}

export function trackAuthMagicLinkRequested(props?: AuthEventProps) {
  track("auth_magiclink_requested", props);
}

export function trackAuthLoginSuccess(props?: AuthEventProps) {
  track("auth_login_success", props);
}

export function trackAuthLogout(props?: AuthEventProps) {
  track("auth_logout", props);
}

export function trackOnboardingView(props?: AuthEventProps) {
  track("onboarding_view", props);
}

export function trackOnboardingComplete(props?: AuthEventProps) {
  track("onboarding_complete", props);
}
