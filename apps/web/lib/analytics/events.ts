"use client";

export type AnalyticsScalar = string | number | boolean | null | undefined;
export type AnalyticsProps = Record<string, AnalyticsScalar>;

export type CanonicalAnalyticsEventMap = {
  cta_click: {
    cta_id: string;
    placement: string;
    variant_id?: string;
    page_type?: string;
    template_id?: string;
    cadence?: string;
    source?: string;
  };
  sign_up_start: {
    method: string;
    reason?: string;
  };
  sign_up: {
    method: string;
    entry_point?: string;
  };
  login_start: {
    method: string;
    reason?: string;
    source?: string;
  };
  login: {
    method: string;
    source?: string;
  };
  auth_logout: {
    source?: string;
  };
  onboarding_view: {
    source?: string;
  };
  onboarding_step_complete: {
    step_id: string;
    source?: string;
    goal?: string;
  };
  storybook_create_start: {
    template_id?: string;
    entry_point?: string;
    kind?: string;
  };
  storybook_create: {
    template_id: string;
    entry_point?: string;
    template_version?: string | number;
  };
  storybook_open: {
    storybook_id: string;
  };
  storybook_step_view: {
    step_id: string;
    storybook_id?: string;
    chapter_id?: string;
    question_id?: string;
    action?: string;
  };
  storybook_step_complete: {
    step_id: string;
    template_id?: string;
    storybook_id?: string;
    chapter_id?: string;
    question_id?: string;
    action?: string;
  };
  storybook_rename: {
    storybook_id: string;
    title_changed?: boolean;
    subtitle_changed?: boolean;
  };
  block_inserted: {
    storybook_id?: string;
    chapter_id?: string;
    block_type?: string;
  };
  studio_enter: {
    entry_point?: string;
    chapter_key?: string;
    storybook_id?: string;
  };
  export_start: {
    export_type: "pdf" | "docx" | "ppt";
    pages_bucket?: string;
    render_mode?: string;
  };
  export_complete: {
    export_type: "pdf" | "docx" | "ppt";
    pages_bucket?: string;
    render_mode?: string;
    duration_ms_bucket?: string;
  };
  export_failed: {
    export_type: "pdf" | "docx" | "ppt";
    error_code: string;
    stage: string;
    status_code?: string | number;
  };
  api_error: {
    endpoint_key: string;
    status_code: string | number;
    error_code: string;
  };
  form_error: {
    form_id: string;
    field_key: string;
    error_type: string;
  };
  generate_lead: {
    lead_type: string;
    form_id: string;
    cta_id?: string;
  };
  paywall_view: {
    feature: string;
    reason: string;
    plan_id?: string;
    source?: string;
  };
  begin_checkout: {
    plan_id: string;
    cadence?: string;
    source?: string;
  };
  purchase: {
    transaction_id: string;
    plan_id: string;
    value: number;
    currency: string;
  };
};

export type CanonicalAnalyticsEventName = keyof CanonicalAnalyticsEventMap;

export const canonicalRequiredParams = {
  cta_click: ["cta_id", "placement"],
  sign_up_start: ["method"],
  sign_up: ["method"],
  login_start: ["method"],
  login: ["method"],
  auth_logout: [],
  onboarding_view: [],
  onboarding_step_complete: ["step_id"],
  storybook_create_start: [],
  storybook_create: ["template_id"],
  storybook_open: ["storybook_id"],
  storybook_step_view: ["step_id"],
  storybook_step_complete: ["step_id"],
  storybook_rename: ["storybook_id"],
  block_inserted: [],
  studio_enter: [],
  export_start: ["export_type"],
  export_complete: ["export_type"],
  export_failed: ["export_type", "error_code", "stage"],
  api_error: ["endpoint_key", "status_code", "error_code"],
  form_error: ["form_id", "field_key", "error_type"],
  generate_lead: ["lead_type", "form_id"],
  paywall_view: ["feature", "reason"],
  begin_checkout: ["plan_id"],
  purchase: ["transaction_id", "plan_id", "value", "currency"]
} as const satisfies {
  [K in CanonicalAnalyticsEventName]: readonly (keyof CanonicalAnalyticsEventMap[K])[];
};

export function isCanonicalAnalyticsEventName(event: string): event is CanonicalAnalyticsEventName {
  return Object.prototype.hasOwnProperty.call(canonicalRequiredParams, event);
}

export function getMissingCanonicalParams(event: CanonicalAnalyticsEventName, payload: AnalyticsProps) {
  return canonicalRequiredParams[event].filter((key) => {
    const value = payload[key];
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim().length === 0) return true;
    return false;
  });
}
