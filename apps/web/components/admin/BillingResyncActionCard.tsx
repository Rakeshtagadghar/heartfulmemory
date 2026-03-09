"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export function BillingResyncActionCard({ userId }: { userId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!reason.trim() || !note.trim()) {
      setError("Reason and note are required.");
      return;
    }

    if (!window.confirm("Resync billing state from the provider for this user?")) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/billing/resync`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reason: reason.trim(),
          note: note.trim(),
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Billing resync failed.");
        return;
      }

      setMessage(payload.message ?? "Billing resync completed.");
      router.refresh();
    } catch {
      setError("Billing resync failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
    >
      <h2 className="text-sm font-medium text-white/75">Billing resync</h2>
      <p className="mt-2 text-sm text-white/50">
        Refresh the stored billing subscription state from the provider.
      </p>
      <div className="mt-4 space-y-3">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason for resync"
          className="w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
        />
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Support note"
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
        />
      </div>
      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-white/[0.07] px-3 py-2 text-sm text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Resyncing..." : "Resync billing"}
      </button>
    </form>
  );
}
