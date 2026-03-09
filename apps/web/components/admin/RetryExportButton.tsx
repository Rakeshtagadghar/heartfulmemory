"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RetryExportButton({
  exportId,
  disabledReason,
}: {
  exportId: string;
  disabledReason?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const disabled = Boolean(disabledReason) || isPending;

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        className={[
          "rounded-lg px-3 py-2 text-sm font-medium transition",
          disabled
            ? "cursor-not-allowed bg-white/10 text-white/35"
            : "bg-amber-300 text-slate-950 hover:bg-amber-200",
        ].join(" ")}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const response = await fetch(`/api/admin/exports/${encodeURIComponent(exportId)}/retry`, {
              method: "POST",
            });
            const body = (await response.json()) as {
              success?: boolean;
              error?: { message?: string };
              data?: { newJobId?: string };
            };
            if (!response.ok || !body.success || !body.data?.newJobId) {
              setError(body.error?.message ?? "Retry failed.");
              return;
            }
            router.push(`/admin/exports/${encodeURIComponent(body.data.newJobId)}`);
            router.refresh();
          })
        }
      >
        {isPending ? "Retrying..." : "Retry export"}
      </button>
      {disabledReason ? <p className="mt-2 text-xs text-white/45">{disabledReason}</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
