"use client";

import type { ExportTarget } from "../../../../packages/pdf-renderer/src/contracts";
import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";

export type ExportPdfResponseMeta = {
  pageCount: number;
  exportHash: string;
  warnings: Array<{ code: string; pageId: string; frameId?: string; message: string; severity: "info" | "warning" }>;
  issues?: ExportValidationIssue[];
  blockingIssues?: ExportValidationIssue[];
  warningsFromPreflight?: ExportValidationIssue[];
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
};

export async function requestPdfExport(
  input: {
    storybookId: string;
    exportTarget: ExportTarget;
    preview?: boolean;
  }
): Promise<{ ok: true; blob: Blob; meta: ExportPdfResponseMeta } | { ok: false; error: string }> {
  const response = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    let message = "PDF export failed.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore non-json error response
    }
    return { ok: false, error: message };
  }

  const blob = await response.blob();
  const headerMeta = response.headers.get("x-export-meta");
  if (!headerMeta) {
    return { ok: false, error: "Missing export metadata." };
  }

  try {
    const meta = JSON.parse(headerMeta) as ExportPdfResponseMeta;
    return { ok: true, blob, meta };
  } catch {
    return { ok: false, error: "Invalid export metadata." };
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
      | { ok?: false; error?: string; issues?: ExportValidationIssue[] };
    if (!response.ok || !("ok" in body) || body.ok !== true) {
      return {
        ok: false,
        error: ("error" in body && body.error) || "Export preflight failed.",
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
