"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export function ManualEntitlementActionCard({ userId }: { userId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
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

    if (!window.confirm("Apply a temporary manual entitlement for this user?")) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/billing/manual-entitlement`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            reason: reason.trim(),
            note: note.trim(),
            entitlementStatus: "manually_granted",
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          }),
        }
      );
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Manual entitlement failed.");
        return;
      }

      setMessage(payload.message ?? "Manual entitlement applied.");
      router.refresh();
    } catch {
      setError("Manual entitlement failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
    >
      <h2 className="text-sm font-medium text-white/75">Temporary access grant</h2>
      <p className="mt-2 text-sm text-white/50">
        Apply a time-boxed manual entitlement to restore export access while support investigates.
      </p>
      <div className="mt-4 space-y-3">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason for grant"
          className="w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
        />
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Support note"
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
        />
        <label className="block text-xs text-white/45">
          Optional expiry
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Applying..." : "Grant temporary access"}
      </button>
    </form>
  );
}
