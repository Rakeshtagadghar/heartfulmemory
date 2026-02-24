"use client";

import { useState } from "react";
import type { ExportTarget } from "../../../../packages/pdf-renderer/src/contracts";
import type { ExportPdfResponseMeta } from "../../lib/export/client";
import { requestPdfExport, triggerBlobDownload } from "../../lib/export/client";
import { Button } from "../ui/button";

type ExportState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "failed"; error: string }
  | { status: "ready"; meta: ExportPdfResponseMeta };

export function ExportModal({
  storybookId,
  open,
  onClose
}: {
  storybookId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [target, setTarget] = useState<ExportTarget>("DIGITAL_PDF");
  const [state, setState] = useState<ExportState>({ status: "idle" });

  if (!open) return null;

  async function runExport(preview: boolean) {
    setState({ status: "generating" });
    const result = await requestPdfExport({ storybookId, exportTarget: target, preview });
    if (!result.ok) {
      setState({ status: "failed", error: result.error });
      return;
    }
    if (preview) {
      const url = URL.createObjectURL(result.blob);
      globalThis.open(url, "_blank", "noopener,noreferrer");
    } else {
      triggerBlobDownload(result.blob, result.meta.filename);
    }
    setState({ status: "ready", meta: result.meta });
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/55 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b1320] p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Export PDF</p>
            <h3 className="mt-1 text-lg font-semibold text-parchment">Render from layout canvas</h3>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-white/85">Target</legend>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/80">
              <input
                type="radio"
                name="exportTarget"
                checked={target === "DIGITAL_PDF"}
                onChange={() => setTarget("DIGITAL_PDF")}
              />
              Digital PDF (faster, screen-friendly)
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/80">
              <input
                type="radio"
                name="exportTarget"
                checked={target === "HARDCOPY_PRINT_PDF"}
                onChange={() => setTarget("HARDCOPY_PRINT_PDF")}
              />
              Hardcopy Print PDF (stricter warnings, print-safe)
            </label>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              loading={state.status === "generating"}
              onClick={() => void runExport(false)}
            >
              Download PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={state.status === "generating"}
              onClick={() => void runExport(true)}
            >
              Preview PDF
            </Button>
          </div>

          {state.status === "failed" ? (
            <div className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {state.error}
            </div>
          ) : null}

          {state.status === "ready" ? (
            <div className="space-y-2 rounded-lg border border-emerald-300/15 bg-emerald-500/5 p-3">
              <p className="text-sm text-emerald-100">
                Ready: {state.meta.pageCount} pages · hash{" "}
                <code className="font-mono text-xs">{state.meta.exportHash}</code>
              </p>
              {state.meta.warnings.length > 0 ? (
                <ul className="space-y-1 text-xs text-amber-100">
                  {state.meta.warnings.map((warning) => (
                    <li key={`${warning.code}-${warning.pageId}-${warning.frameId ?? "none"}-${warning.message}`}>
                      {warning.code}: {warning.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/55">No warnings reported.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
