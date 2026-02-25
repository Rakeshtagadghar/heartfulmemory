"use client";

import type { ExportTarget } from "../../../../packages/pdf-renderer/src/contracts";
import type { ExportPreflightResponse } from "../../lib/export/client";
import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";
import { IssuesNavigator } from "./IssuesNavigator";

type PreflightMap = Partial<Record<ExportTarget, ExportPreflightResponse>>;

const targetLabel: Record<ExportTarget, string> = {
  DIGITAL_PDF: "Digital PDF",
  HARDCOPY_PRINT_PDF: "Hardcopy Print PDF"
};

export function ExportIssuesPanel({
  preflights,
  issueDisplayMeta,
  onSelectIssue
}: {
  preflights: PreflightMap;
  issueDisplayMeta?: {
    pageNumberById: Record<string, number>;
    frameNumberById: Record<string, number>;
  };
  onSelectIssue?: (issue: ExportValidationIssue) => void;
}) {
  const targets = Object.entries(preflights) as Array<[ExportTarget, ExportPreflightResponse]>;
  if (targets.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/60">
        Run preflight checks to see warnings and blocking issues before export.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {targets.map(([target, data]) => (
        <div key={target} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white/90">{targetLabel[target]}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                data.canProceed
                  ? "bg-emerald-400/15 text-emerald-200"
                  : "bg-rose-400/15 text-rose-200"
              }`}
            >
              {data.canProceed ? "Ready" : `${data.blockingIssues.length} blocking`}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto pr-1">
            <IssuesNavigator
              issues={data.issues}
              issueDisplayMeta={issueDisplayMeta}
              onSelectIssue={onSelectIssue}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
