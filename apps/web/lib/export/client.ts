"use client";

import type { ExportTarget } from "../../../../packages/pdf-renderer/src/contracts";
import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";
import type { RenderableValidationIssue } from "../../../../packages/pdf/contract/validateRenderable";

export type ExportPdfResponseMeta = {
  pageCount: number;
  exportHash: string;
  warnings: Array<{ code: string; pageId: string; frameId?: string; message: string; severity: "info" | "warning" }>;
  issues?: ExportValidationIssue[];
  blockingIssues?: ExportValidationIssue[];
  warningsFromPreflight?: ExportValidationIssue[];
  contractIssues?: RenderableValidationIssue[];
  contractErrors?: RenderableValidationIssue[];
  contractWarnings?: RenderableValidationIssue[];
  fileKey?: string | null;
  fileUrl?: string | null;
  filename: string;
};

export type ExportPreflightResponse = {
  ok: true;
  exportHash: string;
  target: ExportTarget;
  canProceed: boolean;
  pageCount: number;
  issues: ExportValidationIssue[];
  blockingIssues: ExportValidationIssue[];
  warnings: ExportValidationIssue[];
  contractIssues?: RenderableValidationIssue[];
  contractErrors?: RenderableValidationIssue[];
  contractWarnings?: RenderableValidationIssue[];
};

export type ExportRequestError = {
  message: string;
  code?: string;
  traceId?: string;
  details?: unknown;
};

export async function requestPdfExport(
  input: {
    storybookId: string;
    exportTarget: ExportTarget;
    preview?: boolean;
  }
): Promise<{ ok: true; blob: Blob; meta: ExportPdfResponseMeta } | { ok: false; error: ExportRequestError }> {
  const response = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const fallbackMessage = "PDF export failed.";
    try {
      const body = (await response.json()) as {
        error?: string;
        code?: string;
        traceId?: string;
        details?: unknown;
      };
      const message = body.error
        ? body.traceId
          ? `${body.error} (${body.traceId})`
          : body.error
        : fallbackMessage;
      return {
        ok: false,
        error: {
          message,
          code: body.code,
          traceId: body.traceId,
          details: body.details
        }
      };
    } catch {
      return {
        ok: false,
        error: {
          message: fallbackMessage
        }
      };
    }
  }

  const blob = await response.blob();
  const headerMeta = response.headers.get("x-export-meta");
  if (!headerMeta) {
    return {
      ok: false,
      error: {
        message: "Missing export metadata."
      }
    };
  }

  try {
    const meta = JSON.parse(headerMeta) as ExportPdfResponseMeta;
    return { ok: true, blob, meta };
  } catch {
    return {
      ok: false,
      error: {
        message: "Invalid export metadata."
      }
    };
  }
}

export async function requestExportPreflight(
  input: {
    storybookId: string;
    exportTarget: ExportTarget;
  }
): Promise<{ ok: true; data: ExportPreflightResponse } | { ok: false; error: string; issues?: ExportValidationIssue[] }> {
  try {
    const response = await fetch("/api/export/pdf", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, validateOnly: true })
    });
    const body = (await response.json()) as
      | ExportPreflightResponse
      | { ok?: false; error?: string; issues?: ExportValidationIssue[]; traceId?: string };
    if (!response.ok || !("ok" in body) || body.ok !== true) {
      return {
        ok: false,
        error:
          ("error" in body && body.error ? body.error : "Export preflight failed.") +
          ("traceId" in body && body.traceId ? ` (${body.traceId})` : ""),
        issues: "issues" in body ? body.issues : undefined
      };
    }
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: "Failed to fetch export preflight." };
  }
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
