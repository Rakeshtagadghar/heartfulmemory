"use client";

import { track } from "./client";

export function trackStudioExportClickBlocked(input: {
  source: "studio_export";
  planId: "free" | "pro";
}) {
  track("paywall_view", {
    feature: "export",
    reason: "plan_gate",
    source: input.source,
    plan_id: input.planId
  });
}

export function trackStudioExportClickAllowed(input: {
  source: "studio_export";
  planId: "free" | "pro";
}) {
  track("cta_click", {
    cta_id: "export_open",
    placement: input.source,
    source: input.source,
    variant_id: input.planId
  });
}
