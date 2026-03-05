"use client";

import { track } from "./client";

type AuthEventProps = Record<string, string | number | boolean | null | undefined>;

function resolveLoginMethod(source: string | null | undefined) {
  switch ((source ?? "").toLowerCase()) {
    case "email_link":
    case "email_link_request":
    case "magic_link":
      return "magic_link";
    case "password_form":
    case "password":
      return "password";
    case "google":
      return "google";
    default:
      return "magic_link";
  }
}

export function trackAuthViewLogin(props?: AuthEventProps & { source?: string }) {
  track("login_start", {
    method: resolveLoginMethod(typeof props?.source === "string" ? props.source : null),
    ...props
  });
}

export function trackAuthMagicLinkRequested(props?: AuthEventProps & { source?: string }) {
  track("login_start", {
    method: "magic_link",
    reason: "magic_link_requested",
    ...props
  });
}

export function trackAuthLoginSuccess(props?: AuthEventProps & { source?: string }) {
  track("login", {
    method: resolveLoginMethod(typeof props?.source === "string" ? props.source : null),
    ...props
  });
}

export function trackAuthLogout(props?: AuthEventProps) {
  track("auth_logout", props ?? {});
}

export function trackOnboardingView(props?: AuthEventProps) {
  track("onboarding_view", props ?? {});
}

export function trackOnboardingComplete(props?: AuthEventProps) {
  track("onboarding_step_complete", {
    step_id: "profile_setup",
    ...props
  });
}
