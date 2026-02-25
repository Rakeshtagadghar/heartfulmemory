"use client";

import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";

export type IssueHighlightMap = Record<string, Record<string, string[]>>;

export function buildIssueHighlightMap(issues: ExportValidationIssue[]): IssueHighlightMap {
  const map: IssueHighlightMap = {};
  for (const issue of issues) {
    if (!issue.frameId) continue;
    if (!map[issue.pageId]) map[issue.pageId] = {};
    if (!map[issue.pageId][issue.frameId]) map[issue.pageId][issue.frameId] = [];
    map[issue.pageId][issue.frameId].push(issue.message);
  }
  return map;
}

export function groupIssuesByPage(issues: ExportValidationIssue[]) {
  const grouped = new Map<string, ExportValidationIssue[]>();
  for (const issue of issues) {
    const list = grouped.get(issue.pageId) ?? [];
    list.push(issue);
    grouped.set(issue.pageId, list);
  }
  return [...grouped.entries()].map(([pageId, pageIssues]) => ({
    pageId,
    issues: pageIssues
  }));
}

