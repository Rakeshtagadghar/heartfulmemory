"use client";

import { track } from "./client";

export function trackPaywallShown(props: { source: "studio_export"; planId: "free" | "pro" }) {
  track("paywall_shown", {
    source: props.source,
    plan_id: props.planId
  });
}

export function trackPaywallUpgradeClick(props: { planId: "pro"; cadence: "monthly" | "annual" }) {
  track("paywall_upgrade_click", {
    plan_id: props.planId,
    cadence: props.cadence
  });
}

export function trackCheckoutRedirected(props: { planId: "pro"; cadence: "monthly" | "annual" }) {
  track("checkout_redirected", {
    plan_id: props.planId,
    cadence: props.cadence
  });
}

