"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type TemplateOrderItem = {
  id: string;
  name: string;
  status: string;
  displayOrder: number | null;
  isDefault: boolean;
};

export function TemplateOrderingManager({ items }: { items: TemplateOrderItem[] }) {
  const router = useRouter();
  const [draftOrders, setDraftOrders] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item, index) => [item.id, String(item.displayOrder ?? index + 1)]))
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        const leftOrder = Number(draftOrders[left.id] ?? left.displayOrder ?? 0);
        const rightOrder = Number(draftOrders[right.id] ?? right.displayOrder ?? 0);
        return leftOrder - rightOrder;
      }),
    [draftOrders, items]
  );

  async function onSave() {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const payload = sortedItems.map((item) => ({
        templateId: item.id,
        displayOrder: Number(draftOrders[item.id] ?? item.displayOrder ?? 0),
      }));
      const response = await fetch("/api/admin/templates/reorder", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ items: payload }),
      });
      const body = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
      };

      if (!response.ok || !body.success) {
        setError(body.error?.message ?? "Template order could not be updated.");
        return;
      }

      setMessage(body.message ?? "Template order updated.");
      router.refresh();
    } catch {
      setError("Template order could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-white/75">Ordering manager</h2>
          <p className="mt-2 text-sm text-white/50">
            Update display order for the current catalog view.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={pending}
          className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save order"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {sortedItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <input
              type="number"
              min={1}
              value={draftOrders[item.id] ?? ""}
              onChange={(event) =>
                setDraftOrders((current) => ({ ...current, [item.id]: event.target.value }))
              }
              className="w-20 rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/80">{item.name}</p>
              <p className="mt-1 text-xs text-white/40">
                {item.status.replaceAll("_", " ")}
                {item.isDefault ? " | default" : ""}
              </p>
            </div>
            <span className="font-mono text-[11px] text-white/30">{item.id}</span>
          </div>
        ))}
      </div>

      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
    </section>
  );
}
