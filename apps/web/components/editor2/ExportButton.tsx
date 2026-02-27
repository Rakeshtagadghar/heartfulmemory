"use client";

import { useState } from "react";
import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";
import type { StorybookExportSettingsV1 } from "../../../../packages/shared-schema/storybookSettings.types";
import { UpgradeModal } from "../billing/UpgradeModal";
import { useEntitlements } from "../../lib/billing/useEntitlements";
import { trackStudioExportClickAllowed, trackStudioExportClickBlocked } from "../../lib/analytics/studioExportEvents";
import { ExportModal } from "./ExportModal";
import { ExportButtonCrown } from "../studio/ExportButtonCrown";

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
  const [openExportModal, setOpenExportModal] = useState(false);
  const [openUpgradeModal, setOpenUpgradeModal] = useState(false);
  const { entitlements, loading, error } = useEntitlements();
  const canExportDigital = entitlements?.canExportDigital ?? Boolean(error);
  const isPremiumLocked = !canExportDigital;
  const planId = entitlements?.planId ?? "free";

  function handleOpen() {
    onOpen?.();
    if (isPremiumLocked) {
      trackStudioExportClickBlocked({ source: "studio_export", planId });
      setOpenUpgradeModal(true);
      return;
    }

    trackStudioExportClickAllowed({ source: "studio_export", planId });
    setOpenExportModal(true);
  }

  return (
    <>
      <ExportButtonCrown premiumLocked={isPremiumLocked} disabled={loading} onClick={handleOpen} />
      <ExportModal
        storybookId={storybookId}
        storybookSettings={storybookSettings}
        issueDisplayMeta={issueDisplayMeta}
        open={openExportModal}
        onClose={() => setOpenExportModal(false)}
        onExportSettingsChange={onExportSettingsChange}
        onIssueNavigate={onIssueNavigate}
        onIssuesUpdate={onIssuesUpdate}
      />
      <UpgradeModal open={openUpgradeModal} onClose={() => setOpenUpgradeModal(false)} />
    </>
  );
}
