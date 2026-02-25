"use client";

import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";
import { groupIssuesByPage } from "./CanvasFocus";

export function IssuesNavigator({
  issues,
  issueDisplayMeta,
  onSelectIssue
}: {
  issues: ExportValidationIssue[];
  issueDisplayMeta?: {
    pageNumberById: Record<string, number>;
    frameNumberById: Record<string, number>;
  };
  onSelectIssue?: (issue: ExportValidationIssue) => void;
}) {
  if (issues.length === 0) {
    return <p className="text-xs text-white/60">No issues found.</p>;
  }

  return (
    <div className="space-y-3">
      {groupIssuesByPage(issues).map((group) => (
        <div key={group.pageId} className="rounded-lg border border-white/10 bg-black/10 p-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
            Page {issueDisplayMeta?.pageNumberById[group.pageId] ?? "?"}
          </p>
          <ul className="space-y-1.5 text-xs">
            {group.issues.map((issue) => (
              <li key={`${issue.code}:${issue.pageId}:${issue.frameId ?? "none"}:${issue.message}`}>
                <button
                  type="button"
                  className={`w-full cursor-pointer rounded-md border px-2 py-1 text-left ${
                    issue.blocking
                      ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
                      : "border-amber-300/15 bg-amber-500/10 text-amber-100"
                  }`}
                  onClick={() => onSelectIssue?.(issue)}
                >
                  <div className="font-semibold">
                    {issue.code}
                    {issue.frameId
                      ? ` · Frame ${issueDisplayMeta?.frameNumberById[issue.frameId] ?? "?"}`
                      : ""}
                  </div>
                  <div className="mt-0.5 text-white/85">{issue.message}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
