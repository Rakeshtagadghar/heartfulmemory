"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ExportTarget } from "../../../../packages/pdf-renderer/src/contracts";
import type { ExportValidationIssue } from "../../../../packages/rules-engine/src";
import type { StorybookExportSettingsV1 } from "../../../../packages/shared-schema/storybookSettings.types";
import { normalizeStorybookExportSettingsV1 } from "../../../../packages/shared-schema/storybookSettings.types";
import type { ExportPreflightResponse, ExportRequestError } from "../../lib/export/client";
import { requestExportPreflight, requestPdfExport, triggerBlobDownload } from "../../lib/export/client";
import { updateLayoutStorybookSettingsAction } from "../../lib/actions/editor2";
import {
  captureStudioError,
  recordStudioMilestone,
  withStudioSpan
} from "../studio/observability";
import { Button } from "../ui/button";
import { ExportHistory } from "./ExportHistory";
import { ExportIssuesPanel } from "./ExportIssuesPanel";
import { ExportResultsPanel, type ExportResultItem } from "./ExportResultsPanel";

type TargetRunState = "idle" | "checking" | "blocked" | "generating" | "done" | "failed";
type ExportSelection = "DIGITAL_ONLY" | "HARDCOPY_ONLY" | "BOTH";
type ExportRunMap = Record<ExportTarget, { status: TargetRunState; error?: string }>;
type BillingActionHint = "upgrade" | "manage" | null;

const targetLabels: Record<ExportTarget, string> = {
  DIGITAL_PDF: "Digital PDF",
  HARDCOPY_PRINT_PDF: "Hardcopy Print PDF"
};

function targetsFor(selection: ExportSelection): ExportTarget[] {
  if (selection === "DIGITAL_ONLY") return ["DIGITAL_PDF"];
  if (selection === "HARDCOPY_ONLY") return ["HARDCOPY_PRINT_PDF"];
  return ["DIGITAL_PDF", "HARDCOPY_PRINT_PDF"];
}

function summarizePreflightBlock(preflight: ExportPreflightResponse) {
  const blockingCount = preflight.blockingIssues.length;
  const contractErrorCount = preflight.contractErrors?.length ?? 0;
  const totalBlocking = blockingCount + contractErrorCount;
  if (totalBlocking <= 0) return "blocked";
  const parts: string[] = [];
  if (blockingCount > 0) {
    parts.push(`${blockingCount} preflight issue${blockingCount === 1 ? "" : "s"}`);
  }
  if (contractErrorCount > 0) {
    parts.push(`${contractErrorCount} contract error${contractErrorCount === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
}

function resolveBillingActionHint(error: ExportRequestError): BillingActionHint {
  if (error.code === "EXPORT_PLAN_UPGRADE_REQUIRED") return "upgrade";
  if (error.code === "EXPORT_QUOTA_EXCEEDED") {
    const details = error.details as { planId?: string } | undefined;
    if (details?.planId === "pro") return "manage";
    return "upgrade";
  }
  return null;
}

export function ExportModal({
  storybookId,
  storybookSettings,
  issueDisplayMeta,
  open,
  onClose,
  onExportSettingsChange,
  onIssueNavigate,
  onIssuesUpdate
}: {
  storybookId: string;
  storybookSettings: StorybookExportSettingsV1;
  issueDisplayMeta?: {
    pageNumberById: Record<string, number>;
    frameNumberById: Record<string, number>;
  };
  open: boolean;
  onClose: () => void;
  onExportSettingsChange?: (next: StorybookExportSettingsV1) => void;
  onIssueNavigate?: (issue: ExportValidationIssue) => void;
  onIssuesUpdate?: (issues: ExportValidationIssue[]) => void;
}) {
  const [settingsDraft, setSettingsDraft] = useState<StorybookExportSettingsV1>(
    normalizeStorybookExportSettingsV1(storybookSettings)
  );
  const [selection, setSelection] = useState<ExportSelection>("DIGITAL_ONLY");
  const [preflightByTarget, setPreflightByTarget] = useState<Partial<Record<ExportTarget, ExportPreflightResponse>>>({});
  const [runState, setRunState] = useState<ExportRunMap>({
    DIGITAL_PDF: { status: "idle" },
    HARDCOPY_PRINT_PDF: { status: "idle" }
  });
  const [results, setResults] = useState<ExportResultItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [billingActionHint, setBillingActionHint] = useState<BillingActionHint>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const activeTargets = useMemo(() => targetsFor(selection), [selection]);
  const isBusy = Object.values(runState).some(
    (entry) => entry.status === "checking" || entry.status === "generating"
  );

  if (!open) return null;

  async function runPreflightForTarget(target: ExportTarget) {
    setRunState((current) => ({ ...current, [target]: { status: "checking" } }));
    recordStudioMilestone("export_step", "export_preflight", {
      flow: "studio_export",
      storybookId,
      mode: target
    }, "start");
    const result = await withStudioSpan(
      "export_preflight",
      {
        flow: "studio_export",
        storybookId,
        mode: target
      },
      () => requestExportPreflight({ storybookId, exportTarget: target })
    );
    if (!result.ok) {
      setRunState((current) => ({ ...current, [target]: { status: "failed", error: result.error } }));
      setGlobalError(result.error);
      captureStudioError(result.error, {
        flow: "studio_export",
        storybookId,
        mode: target
      });
      recordStudioMilestone("export_step", "export_preflight", {
        flow: "studio_export",
        storybookId,
        mode: target
      }, "failed");
      return null;
    }
    setPreflightByTarget((current) => ({ ...current, [target]: result.data }));
    setRunState((current) => ({
      ...current,
      [target]: result.data.canProceed
        ? { status: "idle" }
        : { status: "blocked", error: summarizePreflightBlock(result.data) }
    }));
    recordStudioMilestone("export_step", "export_preflight", {
      flow: "studio_export",
      storybookId,
      mode: target
    }, result.data.canProceed ? "success" : "failed");
    return result.data;
  }

  async function runChecks() {
    setGlobalError(null);
    setBillingActionHint(null);
    const mergedIssues: ExportValidationIssue[] = [];
    for (const target of activeTargets) {
      const result = await runPreflightForTarget(target);
      if (result) mergedIssues.push(...result.issues);
    }
    onIssuesUpdate?.(mergedIssues);
  }

  async function runTargetExport(target: ExportTarget, preview: boolean) {
    const preflight = await runPreflightForTarget(target);
    if (!preflight) return;
    if (!preflight.canProceed) {
      setRunState((current) => ({
        ...current,
        [target]: { status: "blocked", error: summarizePreflightBlock(preflight) }
      }));
      const blockingCount = preflight.blockingIssues.length;
      const contractErrorCount = preflight.contractErrors?.length ?? 0;
      const firstBlocking = preflight.blockingIssues[0];
      setGlobalError(
        blockingCount > 0 || contractErrorCount > 0
          ? `Export blocked for ${targetLabels[target]} (${summarizePreflightBlock(preflight)}). Resolve the issues below and try again.`
          : `Export blocked for ${targetLabels[target]}. Resolve preflight issues below and try again.`
      );
      onIssuesUpdate?.(
        [
          ...Object.entries(preflightByTarget)
            .filter(([key]) => key !== target)
            .flatMap(([, item]) => item?.issues ?? []),
          ...preflight.issues
        ]
      );
      recordStudioMilestone("export_step", "export_generate", {
        flow: "studio_export",
        storybookId,
        mode: target,
        code: firstBlocking?.code
      }, "failed");
      return;
    }

    setRunState((current) => ({ ...current, [target]: { status: "generating" } }));
    recordStudioMilestone("export_step", "export_generate", {
      flow: "studio_export",
      storybookId,
      mode: target
    }, "start");
    const result = await withStudioSpan(
      "export_generate",
      {
        flow: "studio_export",
        storybookId,
        mode: target
      },
      () => requestPdfExport({ storybookId, exportTarget: target, preview })
    );
    if (!result.ok) {
      setRunState((current) => ({ ...current, [target]: { status: "failed", error: result.error.message } }));
      setGlobalError(result.error.message);
      setBillingActionHint(resolveBillingActionHint(result.error));
      captureStudioError(result.error.message, {
        flow: "studio_export",
        storybookId,
        mode: target
      });
      recordStudioMilestone("export_step", "export_generate", {
        flow: "studio_export",
        storybookId,
        mode: target
      }, "failed");
      return;
    }

    if (preview) {
      const url = URL.createObjectURL(result.blob);
      globalThis.open(url, "_blank", "noopener,noreferrer");
    } else {
      triggerBlobDownload(result.blob, result.meta.filename);
    }

    setResults((current) => [
      {
        target,
        filename: result.meta.filename,
        pageCount: result.meta.pageCount,
        exportHash: result.meta.exportHash,
        fileSizeBytes: result.blob.size,
        createdAt: new Date().toISOString(),
        warningsCount:
          (result.meta.warnings?.length ?? 0) + (result.meta.warningsFromPreflight?.length ?? 0)
      },
      ...current.filter((item) => !(item.target === target && item.exportHash === result.meta.exportHash))
    ]);

    setRunState((current) => ({ ...current, [target]: { status: "done" } }));
    recordStudioMilestone("export_step", "export_generate", {
      flow: "studio_export",
      storybookId,
      mode: target
    }, "success");
  }

  async function generateSelected(preview: boolean) {
    setGlobalError(null);
    setBillingActionHint(null);
    for (const target of activeTargets) {
      if (preview && activeTargets.length > 1) break;
      await runTargetExport(target, preview);
    }
  }

  const visiblePreflights = Object.fromEntries(
    activeTargets.flatMap((target) => (preflightByTarget[target] ? [[target, preflightByTarget[target]]] : []))
  ) as Partial<Record<ExportTarget, ExportPreflightResponse>>;

  async function saveExportSettings() {
    setSavingSettings(true);
    const result = await updateLayoutStorybookSettingsAction(storybookId, {
      exportTargets: {
        digitalPdf: settingsDraft.exportTargets.digitalPdf,
        hardcopyPdf: settingsDraft.exportTargets.hardcopyPdf
      },
      printPreset: settingsDraft.printPreset,
      digitalPreset: settingsDraft.digitalPreset
    });
    setSavingSettings(false);
    if (!result.ok) {
      setGlobalError(result.error);
      return;
    }
    onExportSettingsChange?.(normalizeStorybookExportSettingsV1(result.data.settings));
    setGlobalError(null);
  }

  const modal = (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-black/55 p-4">
      <div className="mx-auto flex min-h-full w-full max-w-4xl items-center justify-center py-4">
        <div className="flex max-h-[min(90dvh,calc(100%-2rem))] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1320] p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Export PDF</p>
            <h3 className="mt-1 text-lg font-semibold text-parchment">Digital + Hardcopy Export</h3>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <div className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-white/85">Mode</legend>
                {[
                  ["DIGITAL_ONLY", "Digital only"],
                  ["HARDCOPY_ONLY", "Hardcopy only"],
                  ["BOTH", "Both (digital + hardcopy)"]
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/80"
                  >
                    <input
                      type="radio"
                      name="exportSelection"
                      checked={selection === value}
                      onChange={() => setSelection(value as ExportSelection)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>

              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white/85">Export Settings</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    loading={savingSettings}
                    onClick={() => void saveExportSettings()}
                  >
                    Save
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 text-xs">
                  <label className="flex items-center justify-between gap-2 text-white/75">
                    <span>Enable Digital PDF</span>
                    <input
                      type="checkbox"
                      checked={settingsDraft.exportTargets.digitalPdf}
                      onChange={(event) =>
                        setSettingsDraft((current) => ({
                          ...current,
                          exportTargets: { ...current.exportTargets, digitalPdf: event.target.checked }
                        }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-white/75">
                    <span>Enable Hardcopy PDF</span>
                    <input
                      type="checkbox"
                      checked={settingsDraft.exportTargets.hardcopyPdf}
                      onChange={(event) =>
                        setSettingsDraft((current) => ({
                          ...current,
                          exportTargets: { ...current.exportTargets, hardcopyPdf: event.target.checked }
                        }))
                      }
                    />
                  </label>
                  <label className="block text-white/75">
                    Hardcopy safe-area padding (px)
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={settingsDraft.printPreset.safeAreaPadding}
                      onChange={(event) =>
                        setSettingsDraft((current) => ({
                          ...current,
                          printPreset: { ...current.printPreset, safeAreaPadding: Number(event.target.value) }
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
                    />
                  </label>
                  <label className="block text-white/75">
                    Hardcopy min image width (px)
                    <input
                      type="number"
                      min={600}
                      step={100}
                      value={settingsDraft.printPreset.minImageWidthPx}
                      onChange={(event) =>
                        setSettingsDraft((current) => ({
                          ...current,
                          printPreset: { ...current.printPreset, minImageWidthPx: Number(event.target.value) }
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-black/25 px-2 text-sm text-white"
                    />
                  </label>
                </div>
              </section>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="mb-2 text-sm font-semibold text-white/85">Target Progress</p>
                <div className="space-y-2 text-xs">
                  {(["DIGITAL_PDF", "HARDCOPY_PRINT_PDF"] as const).map((target) => (
                    <div key={target} className="flex items-center justify-between gap-2">
                      <span className="text-white/80">{targetLabels[target]}</span>
                      <span className="text-white/55">
                        {runState[target].status}
                        {runState[target].error ? ` · ${runState[target].error}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" loading={isBusy} onClick={() => void runChecks()}>
                  Run Checks
                </Button>
                <Button type="button" loading={isBusy} onClick={() => void generateSelected(false)}>
                  {selection === "BOTH" ? "Generate Selected PDFs" : "Download PDF"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  loading={isBusy}
                  disabled={selection === "BOTH"}
                  onClick={() => void generateSelected(true)}
                >
                  Preview PDF
                </Button>
              </div>

              {globalError ? (
                <div className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  {globalError}
                  {billingActionHint === "upgrade" ? (
                    <div className="mt-2">
                      <Link
                        href="/app/account/billing?intent=upgrade"
                        className="inline-flex items-center rounded-lg border border-gold/55 bg-gold/90 px-2 py-1 text-xs font-semibold text-ink hover:bg-[#e3c17b]"
                      >
                        Upgrade to export
                      </Link>
                    </div>
                  ) : null}
                  {billingActionHint === "manage" ? (
                    <div className="mt-2">
                      <Link
                        href="/app/account/billing"
                        className="inline-flex items-center rounded-lg border border-white/20 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-white hover:bg-white/[0.08]"
                      >
                        Manage billing
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <ExportIssuesPanel
                preflights={visiblePreflights}
                issueDisplayMeta={issueDisplayMeta}
                onSelectIssue={onIssueNavigate}
              />
              <ExportResultsPanel results={results} />
            </div>

            <div>
              <ExportHistory storybookId={storybookId} />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
