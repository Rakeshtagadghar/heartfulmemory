"use client";

import { track } from "./client";

export function trackPaywallShown(props: { source: "studio_export"; planId: "free" | "pro" }) {
  track("paywall_view", {
    feature: "export",
    reason: "plan_gate",
    source: props.source,
    plan_id: props.planId
  });
}

export function trackPaywallUpgradeClick(props: { planId: "pro"; cadence: "monthly" | "annual" }) {
  track("cta_click", {
    cta_id: "paywall_upgrade_click",
    placement: "upgrade_modal",
    cadence: props.cadence,
    source: "paywall"
  });
}

export function trackCheckoutRedirected(props: { planId: "pro"; cadence: "monthly" | "annual" }) {
  track("begin_checkout", {
    plan_id: props.planId,
    cadence: props.cadence,
    source: "upgrade_modal"
  });
}
