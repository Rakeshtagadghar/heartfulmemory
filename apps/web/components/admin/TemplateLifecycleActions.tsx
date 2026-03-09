"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminTemplateActionState, AdminTemplateStatus } from "../../../../packages/shared/admin/templates";

async function postAction(url: string) {
  const response = await fetch(url, { method: "POST" });
  const payload = (await response.json()) as {
    success?: boolean;
    message?: string;
    error?: { message?: string };
  };
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Action failed.");
  }
  return payload.message ?? "Action completed.";
}

export function TemplateLifecycleActions({
  templateId,
  status,
  isDefault,
  actionState,
  canPublish,
  canArchive,
  canManage,
}: {
  templateId: string;
  status: AdminTemplateStatus;
  isDefault: boolean;
  actionState: AdminTemplateActionState;
  canPublish: boolean;
  canArchive: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "publish" | "disable" | "archive" | "set-default") {
    setPendingAction(action);
    setMessage(null);
    setError(null);

    try {
      const endpoint =
        action === "publish"
          ? `/api/admin/templates/${encodeURIComponent(templateId)}/publish`
          : action === "disable"
            ? `/api/admin/templates/${encodeURIComponent(templateId)}/disable`
            : action === "archive"
              ? `/api/admin/templates/${encodeURIComponent(templateId)}/archive`
              : `/api/admin/templates/${encodeURIComponent(templateId)}/set-default`;
      const confirmMessage =
        action === "publish"
          ? "Publish this template for user selection?"
          : action === "disable"
            ? "Disable this template for new selections?"
            : action === "archive"
              ? "Archive this template?"
              : "Set this template as the default for its category?";

      if (!window.confirm(confirmMessage)) {
        setPendingAction(null);
        return;
      }

      const nextMessage = await postAction(endpoint);
      setMessage(nextMessage);
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Action failed.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-medium text-white/75">Lifecycle and defaults</h2>
      <p className="mt-2 text-sm text-white/50">Current status: {status.replaceAll("_", " ")}</p>

      {actionState.publishErrors.length > 0 ? (
        <div className="mt-4 space-y-2">
          {actionState.publishErrors.map((publishError) => (
            <div key={publishError} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
              {publishError}
            </div>
          ))}
        </div>
      ) : null}

      {actionState.archiveBlockReason ? (
        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-sm text-white/60">
          {actionState.archiveBlockReason}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {canPublish ? (
          <>
            <button
              type="button"
              disabled={!actionState.canPublish || pendingAction !== null}
              onClick={() => void runAction("publish")}
              className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAction === "publish" ? "Publishing..." : "Publish"}
            </button>
            <button
              type="button"
              disabled={!actionState.canDisable || pendingAction !== null}
              onClick={() => void runAction("disable")}
              className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAction === "disable" ? "Disabling..." : "Disable"}
            </button>
          </>
        ) : null}

        {canArchive ? (
          <button
            type="button"
            disabled={!actionState.canArchive || pendingAction !== null}
            onClick={() => void runAction("archive")}
            className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "archive" ? "Archiving..." : "Archive"}
          </button>
        ) : null}

        {canManage ? (
          <button
            type="button"
            disabled={!actionState.canSetDefault || isDefault || pendingAction !== null}
            onClick={() => void runAction("set-default")}
            className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "set-default"
              ? "Updating..."
              : isDefault
                ? "Current default"
                : "Set as default"}
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
    </section>
  );
}
