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

function formatContractIssueLocation(
  issue: {
    pageId?: string;
    nodeId?: string;
    path?: string;
  },
  issueDisplayMeta?: {
    pageNumberById: Record<string, number>;
    frameNumberById: Record<string, number>;
  }
) {
  const locationParts: string[] = [];
  if (issue.pageId) {
    const pageNumber = issueDisplayMeta?.pageNumberById[issue.pageId];
    locationParts.push(pageNumber ? `Page ${pageNumber}` : `Page ${issue.pageId}`);
  }
  if (issue.nodeId) {
    const frameNumber = issueDisplayMeta?.frameNumberById[issue.nodeId];
    locationParts.push(frameNumber ? `Frame ${frameNumber}` : `Node ${issue.nodeId}`);
  }
  if (locationParts.length === 0 && issue.path) {
    locationParts.push(issue.path);
  }
  return locationParts.join(" | ");
}

function toNavigationIssue(
  target: ExportTarget,
  issue: {
    message: string;
    pageId?: string;
    nodeId?: string;
  }
): ExportValidationIssue | null {
  if (!issue.pageId) return null;
  return {
    code: "PRINT_FRAME_OUTSIDE_PAGE",
    target,
    severity: "error",
    blocking: true,
    pageId: issue.pageId,
    frameId: issue.nodeId,
    path: {
      pageId: issue.pageId,
      frameId: issue.nodeId
    },
    message: issue.message
  };
}

function renderContractErrorRow(input: {
  target: ExportTarget;
  issue: {
    code: string;
    message: string;
    pageId?: string;
    nodeId?: string;
    path?: string;
  };
  index: number;
  issueDisplayMeta?: {
    pageNumberById: Record<string, number>;
    frameNumberById: Record<string, number>;
  };
  onSelectIssue?: (issue: ExportValidationIssue) => void;
}) {
  const { target, issue, index, issueDisplayMeta, onSelectIssue } = input;
  const key = `${issue.code}-${issue.nodeId ?? issue.pageId ?? "na"}-${index}`;
  const location = formatContractIssueLocation(issue, issueDisplayMeta);
  const navigationIssue = toNavigationIssue(target, issue);
  const label = `${issue.code}: ${issue.message}${location ? ` (${location})` : ""}`;

  if (!navigationIssue) {
    return (
      <p key={key} className="text-[11px] text-rose-100/90">
        {label}
      </p>
    );
  }

  return (
    <button
      key={key}
      type="button"
      className="w-full cursor-pointer rounded-md border border-rose-300/20 bg-rose-500/10 px-2 py-1 text-left text-[11px] text-rose-100/90 hover:bg-rose-500/15"
      onClick={() => onSelectIssue?.(navigationIssue)}
    >
      {label}
    </button>
  );
}

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
      {targets.map(([target, data]) => {
        const contractErrors = data.contractErrors ?? [];
        const blockingCount = data.blockingIssues.length;
        const contractErrorCount = contractErrors.length;
        const totalBlocking = blockingCount + contractErrorCount;
        return (
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
              {data.canProceed ? "Ready" : `${totalBlocking} blocking`}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto pr-1">
            <IssuesNavigator
              issues={data.issues}
              issueDisplayMeta={issueDisplayMeta}
              onSelectIssue={onSelectIssue}
            />
            {contractErrors.length > 0 ? (
              <div className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-2">
                <p className="mb-1 text-[11px] font-semibold text-rose-100">
                  Contract Errors ({contractErrors.length})
                </p>
                <div className="space-y-1">
                  {contractErrors.slice(0, 4).map((issue, index) =>
                    renderContractErrorRow({
                      target,
                      issue,
                      index,
                      issueDisplayMeta,
                      onSelectIssue
                    })
                  )}
                  {contractErrors.length > 4 ? (
                    <p className="text-[11px] text-rose-100/70">
                      +{contractErrors.length - 4} more contract errors
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          </div>
        );
      })}
    </div>
  );
}
