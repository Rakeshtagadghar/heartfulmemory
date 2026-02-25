"use client";

import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import { listExportHistoryAction, type ExportHistoryItem } from "../../lib/actions/editor2";
import { Button } from "../ui/button";

const targetLabel = {
  DIGITAL_PDF: "Digital",
  HARDCOPY_PRINT_PDF: "Hardcopy"
} as const;

export function ExportHistory({ storybookId }: { storybookId: string }) {
  const [items, setItems] = useState<ExportHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      void (async () => {
        const result = await listExportHistoryAction(storybookId, 8);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setItems(result.data);
        setError(null);
      })();
    });
  }, [storybookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  let content: ReactNode;
  if (error) {
    content = <p className="text-xs text-rose-200">{error}</p>;
  } else if (items.length === 0) {
    content = <p className="text-xs text-white/60">No exports recorded yet.</p>;
  } else {
    content = (
      <ul className="space-y-1.5 text-xs">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-white/10 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/85">
                {targetLabel[item.exportTarget]} · {item.status}
              </span>
              <span className="text-white/55">{new Date(item.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="mt-0.5 text-white/60">
              {item.pageCount} pages · {item.warningsCount} warnings ·{" "}
              <code className="font-mono text-[11px]">{item.exportHash}</code>
            </div>
            {item.status === "SUCCESS" && item.fileKey ? (
              <div className="mt-1">
                <a
                  href={`/api/export/pdf?storybookId=${encodeURIComponent(
                    item.storybookId
                  )}&exportTarget=${encodeURIComponent(item.exportTarget)}&exportHash=${encodeURIComponent(
                    item.exportHash
                  )}`}
                  className="text-cyan-200 underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Re-download
                </a>
              </div>
            ) : null}
            {item.errorSummary ? <div className="mt-0.5 text-rose-200">{item.errorSummary}</div> : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white/90">Recent Exports</p>
        <Button type="button" size="sm" variant="ghost" loading={isPending} onClick={refresh}>
          Refresh
        </Button>
      </div>
      {content}
    </div>
  );
}
