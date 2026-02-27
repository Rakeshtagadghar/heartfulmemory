export type ExportErrorCode =
  | "EXPORT_UNAUTHORIZED"
  | "EXPORT_FORBIDDEN"
  | "EXPORT_RATE_LIMITED"
  | "EXPORT_INVALID_REQUEST"
  | "EXPORT_PLAN_UPGRADE_REQUIRED"
  | "EXPORT_QUOTA_EXCEEDED"
  | "ENTITLEMENT_CHECK_FAILED"
  | "EXPORT_VALIDATION_FAILED"
  | "EXPORT_RENDER_FAILED"
  | "EXPORT_INTERNAL";

export type ExportErrorPayload = {
  ok: false;
  error: string;
  code: ExportErrorCode;
  traceId: string;
  details?: unknown;
};

export function createExportTraceId() {
  return `exp_${crypto.randomUUID()}`;
}

export function buildExportErrorPayload(input: {
  status: number;
  code: ExportErrorCode;
  message: string;
  traceId: string;
  details?: unknown;
}) {
  const body: ExportErrorPayload = {
    ok: false,
    error: input.message,
    code: input.code,
    traceId: input.traceId,
    ...(input.details === undefined ? {} : { details: input.details })
  };
  return { status: input.status, body };
}
