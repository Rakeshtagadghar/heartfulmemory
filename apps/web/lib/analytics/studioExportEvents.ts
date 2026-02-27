"use client";

import { track } from "./client";

export function trackStudioExportClickBlocked(input: {
  source: "studio_export";
  planId: "free" | "pro";
}) {
  track("export_click_blocked", {
    source: input.source,
    plan_id: input.planId
  });
}

export function trackStudioExportClickAllowed(input: {
  source: "studio_export";
  planId: "free" | "pro";
}) {
  track("export_click_allowed", {
    source: input.source,
    plan_id: input.planId
  });
}
