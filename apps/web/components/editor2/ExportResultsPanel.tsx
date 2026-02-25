"use client";

import type { ExportTarget } from "../../../../packages/pdf-renderer/src/contracts";

export type ExportResultItem = {
  target: ExportTarget;
  filename: string;
  pageCount: number;
  exportHash: string;
  fileSizeBytes: number;
  createdAt: string;
  warningsCount: number;
};

const targetLabel: Record<ExportTarget, string> = {
  DIGITAL_PDF: "Digital PDF",
  HARDCOPY_PRINT_PDF: "Hardcopy Print PDF"
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ExportResultsPanel({ results }: { results: ExportResultItem[] }) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-emerald-300/15 bg-emerald-500/5 p-3">
      <p className="text-sm font-semibold text-emerald-100">Export Results</p>
      <ul className="space-y-2 text-xs">
        {results.map((item) => (
          <li key={`${item.target}:${item.exportHash}`} className="rounded-lg border border-white/10 bg-black/10 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white/90">{targetLabel[item.target]}</span>
              <span className="text-white/55">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-1 text-white/70">
              {item.pageCount} pages · {formatBytes(item.fileSizeBytes)} · {item.warningsCount} warnings
            </div>
            <div className="mt-1 text-white/70">
              <code className="font-mono text-[11px]">{item.filename}</code> ·{" "}
              <code className="font-mono text-[11px]">{item.exportHash}</code>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

