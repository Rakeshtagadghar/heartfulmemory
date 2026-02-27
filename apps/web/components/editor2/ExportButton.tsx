"use client";

import { useState } from "react";
import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";
import type { StorybookExportSettingsV1 } from "../../../../packages/shared-schema/storybookSettings.types";
import { Button } from "../ui/button";
import { ExportModal } from "./ExportModal";

export function ExportButton({
  storybookId,
  storybookSettings,
  issueDisplayMeta,
  onExportSettingsChange,
  onIssueNavigate,
  onIssuesUpdate,
  onOpen
}: {
  storybookId: string;
  storybookSettings: StorybookExportSettingsV1;
  issueDisplayMeta?: {
    pageNumberById: Record<string, number>;
    frameNumberById: Record<string, number>;
  };
  onExportSettingsChange?: (next: StorybookExportSettingsV1) => void;
  onIssueNavigate?: (issue: ExportValidationIssue) => void;
  onIssuesUpdate?: (issues: ExportValidationIssue[]) => void;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
      >
        Export
      </Button>
      <ExportModal
        storybookId={storybookId}
        storybookSettings={storybookSettings}
        issueDisplayMeta={issueDisplayMeta}
        open={open}
        onClose={() => setOpen(false)}
        onExportSettingsChange={onExportSettingsChange}
        onIssueNavigate={onIssueNavigate}
        onIssuesUpdate={onIssuesUpdate}
      />
    </>
  );
}
