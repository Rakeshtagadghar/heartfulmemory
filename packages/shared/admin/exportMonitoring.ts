export const ADMIN_EXPORT_RECORD_SOURCES = ["job", "attempt"] as const;
export type AdminExportRecordSource = (typeof ADMIN_EXPORT_RECORD_SOURCES)[number];

export const ADMIN_EXPORT_FORMATS = ["pdf", "docx", "pptx"] as const;
export type AdminExportFormat = (typeof ADMIN_EXPORT_FORMATS)[number];

export const ADMIN_EXPORT_TARGETS = [
  "DIGITAL_PDF",
  "HARDCOPY_PRINT_PDF",
  "DOCX",
  "PPTX",
] as const;
export type AdminExportTarget = (typeof ADMIN_EXPORT_TARGETS)[number];

export const ADMIN_EXPORT_JOB_STATUSES = [
  "queued",
  "processing",
  "succeeded",
  "failed",
] as const;
export type AdminExportJobStatus = (typeof ADMIN_EXPORT_JOB_STATUSES)[number];

export const ADMIN_EXPORT_FAILURE_CATEGORIES = [
  "validation_error",
  "renderer_error",
  "asset_fetch_error",
  "storage_error",
  "timeout",
  "infrastructure_error",
  "unknown_error",
] as const;
export type AdminExportFailureCategory = (typeof ADMIN_EXPORT_FAILURE_CATEGORIES)[number];

export const ADMIN_EXPORT_RETRY_BLOCK_REASONS = [
  "job_not_failed",
  "job_in_progress",
  "project_has_in_progress_export",
  "validation_error",
  "succeeded_rerun_disabled",
] as const;
export type AdminExportRetryBlockReason = (typeof ADMIN_EXPORT_RETRY_BLOCK_REASONS)[number];

export type AdminExportSortField = "createdAt" | "completedAt" | "duration";
export type AdminExportSortOrder = "asc" | "desc";

export interface AdminExportRetryEligibility {
  eligible: boolean;
  caution: boolean;
  reasonCode: AdminExportRetryBlockReason | null;
  blockReason: string | null;
}

export interface AdminExportJobSummary {
  id: string;
  source: AdminExportRecordSource;
  sourceRecordId: string;
  jobId: string | null;
  exportHash: string | null;
  projectId: string;
  projectTitle: string;
  ownerDisplayName: string | null;
  ownerEmail: string | null;
  format: AdminExportFormat;
  exportTarget: AdminExportTarget | null;
  status: AdminExportJobStatus;
  failureCategory: AdminExportFailureCategory | null;
  failureSummary: string | null;
  attemptNumber: number;
  rendererVersion: string | null;
  createdAt: number;
  completedAt: number | null;
  durationMs: number | null;
  retryEligibility: AdminExportRetryEligibility;
}

export interface AdminExportJobDetail extends AdminExportJobSummary {
  projectStatus: string | null;
  ownerId: string | null;
  failureCode: string | null;
  triggerSource: string | null;
  pageCount: number | null;
  warningsCount: number | null;
  retryOfJobId: string | null;
  outputArtifactSummary: {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: number;
  } | null;
}

export interface AdminProjectExportHistoryItem extends AdminExportJobSummary {
  pageCount: number | null;
  warningsCount: number | null;
}

export interface AdminExportJobsQuery {
  q?: string;
  status?: AdminExportJobStatus;
  failureCategory?: AdminExportFailureCategory;
  retryEligible?: boolean;
  dateFrom?: number;
  dateTo?: number;
  sortBy?: AdminExportSortField;
  sortOrder?: AdminExportSortOrder;
  page?: number;
  pageSize?: number;
}

export interface AdminExportJobsListResponse {
  items: AdminExportJobSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface AdminProjectExportHistoryResponse {
  items: AdminProjectExportHistoryItem[];
  total: number;
}

const FAILURE_CATEGORY_MESSAGES: Record<AdminExportFailureCategory, string> = {
  validation_error:
    "The export payload or layout appears invalid. A retry alone may not fix this.",
  renderer_error:
    "The renderer failed while building the document. Review layout or template context before retrying.",
  asset_fetch_error:
    "One or more assets could not be fetched. Retry may help if the issue was temporary.",
  storage_error:
    "The export may have generated but could not be stored or finalized. Retry is usually safe.",
  timeout: "The export exceeded time limits. Retry may succeed if the issue was transient.",
  infrastructure_error:
    "A transient system issue likely interrupted export processing. Retry is usually safe.",
  unknown_error:
    "The failure could not be classified. Retry cautiously and escalate if the issue repeats.",
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function sanitizeFailureSnippet(value: string | null | undefined): string | null {
  const normalized = (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .trim();

  if (!normalized) return null;
  return normalized.slice(0, 180);
}

export function createAdminExportRecordId(
  source: AdminExportRecordSource,
  sourceId: string
): string {
  return `${source}_${sourceId}`;
}

export function parseAdminExportRecordId(
  value: string
): { source: AdminExportRecordSource; sourceId: string } | null {
  if (value.startsWith("job_")) {
    return { source: "job", sourceId: value.slice(4) };
  }
  if (value.startsWith("attempt_")) {
    return { source: "attempt", sourceId: value.slice(8) };
  }
  return null;
}

export function normalizeExportFormatFromJobType(value: string): AdminExportFormat {
  if (value === "docx" || value === "pptx") return value;
  return "pdf";
}

export function normalizeExportFormatFromTarget(value: string): AdminExportFormat {
  if (value === "DOCX") return "docx";
  if (value === "PPTX") return "pptx";
  return "pdf";
}

export function normalizeAdminExportStatus(
  value: "queued" | "running" | "done" | "error" | "SUCCESS" | "FAILED"
): AdminExportJobStatus {
  if (value === "queued") return "queued";
  if (value === "running") return "processing";
  if (value === "done" || value === "SUCCESS") return "succeeded";
  return "failed";
}

export function classifyAdminExportFailure(input: {
  status: AdminExportJobStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
}): AdminExportFailureCategory | null {
  if (input.status !== "failed") return null;

  const code = normalizeText(input.errorCode);
  const message = normalizeText(input.errorMessage);
  const haystack = `${code} ${message}`.trim();

  if (!haystack) return "unknown_error";
  if (
    haystack.includes("validation") ||
    haystack.includes("invalid") ||
    haystack.includes("schema") ||
    haystack.includes("license_missing") ||
    haystack.includes("missing_required")
  ) {
    return "validation_error";
  }
  if (
    haystack.includes("timeout") ||
    haystack.includes("timed out") ||
    haystack.includes("deadline")
  ) {
    return "timeout";
  }
  if (
    haystack.includes("asset") ||
    haystack.includes("image fetch") ||
    haystack.includes("fetch image") ||
    haystack.includes("source url")
  ) {
    return "asset_fetch_error";
  }
  if (
    haystack.includes("storage") ||
    haystack.includes("r2") ||
    haystack.includes("bucket") ||
    haystack.includes("artifact")
  ) {
    return "storage_error";
  }
  if (
    haystack.includes("render") ||
    haystack.includes("pdf") ||
    haystack.includes("docx") ||
    haystack.includes("pptx") ||
    haystack.includes("generation_failed") ||
    haystack.includes("export_render_failed")
  ) {
    return "renderer_error";
  }
  if (
    haystack.includes("network") ||
    haystack.includes("rate limit") ||
    haystack.includes("service unavailable") ||
    haystack.includes("internal") ||
    haystack.includes("infrastructure")
  ) {
    return "infrastructure_error";
  }
  return "unknown_error";
}

export function getAdminFailureCategoryMessage(
  category: AdminExportFailureCategory | null
): string | null {
  if (!category) return null;
  return FAILURE_CATEGORY_MESSAGES[category];
}

export function buildAdminFailureSummary(input: {
  category: AdminExportFailureCategory | null;
  rawMessage?: string | null;
  includeRawMessage?: boolean;
}): string | null {
  if (!input.category) return null;
  const safeRawMessage = sanitizeFailureSnippet(input.rawMessage);
  if (input.includeRawMessage && safeRawMessage) {
    return safeRawMessage;
  }
  return getAdminFailureCategoryMessage(input.category);
}

export function getAdminRetryEligibility(input: {
  status: AdminExportJobStatus;
  failureCategory: AdminExportFailureCategory | null;
  latestProjectExportInProgress: boolean;
  currentJobIsLatest: boolean;
}): AdminExportRetryEligibility {
  if (input.status === "queued" || input.status === "processing") {
    return {
      eligible: false,
      caution: false,
      reasonCode: "job_in_progress",
      blockReason: "Queued or in-progress exports cannot be retried.",
    };
  }

  if (input.status === "succeeded") {
    return {
      eligible: false,
      caution: false,
      reasonCode: "succeeded_rerun_disabled",
      blockReason: "Successful exports are not retryable in admin v1.",
    };
  }

  if (input.latestProjectExportInProgress && !input.currentJobIsLatest) {
    return {
      eligible: false,
      caution: false,
      reasonCode: "project_has_in_progress_export",
      blockReason: "Another export for this project is already queued or processing.",
    };
  }

  if (input.failureCategory === "validation_error") {
    return {
      eligible: false,
      caution: false,
      reasonCode: "validation_error",
      blockReason: "Validation failures usually require content or layout changes before retry.",
    };
  }

  return {
    eligible: true,
    caution: input.failureCategory === "unknown_error",
    reasonCode: null,
    blockReason: null,
  };
}
