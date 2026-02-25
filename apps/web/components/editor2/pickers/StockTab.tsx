"use client";

import { useEffect, useState } from "react";
import type { NormalizedStockResult, StockProviderId } from "../../../lib/stock/types";
import { Button } from "../../ui/button";
import { StockResultCard } from "./StockResultCard";

type StockState =
  | { status: "idle"; results: NormalizedStockResult[] }
  | { status: "loading"; results: NormalizedStockResult[] }
  | { status: "error"; results: NormalizedStockResult[]; error: string };

export function StockTab({
  onInsert
}: {
  onInsert: (result: NormalizedStockResult) => Promise<void>;
}) {
  const [query, setQuery] = useState("paper");
  const [provider, setProvider] = useState<"all" | StockProviderId>("all");
  const [state, setState] = useState<StockState>({ status: "idle", results: [] });
  const [busyInsertId, setBusyInsertId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!query.trim()) {
        setState({ status: "idle", results: [] });
        return;
      }
      setState((current) => ({ status: "loading", results: current.results }));
      try {
        const url = new URL("/api/stock/search", globalThis.location.origin);
        url.searchParams.set("q", query.trim());
        url.searchParams.set("provider", provider);
        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = (await res.json()) as { ok?: boolean; results?: NormalizedStockResult[]; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setState({ status: "error", results: [], error: data.error || "Search failed." });
          return;
        }
        setState({ status: "idle", results: data.results ?? [] });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          results: [],
          error:
            error instanceof Error
              ? `Stock search failed: ${error.message}`
              : "Stock search failed. Check your network and try again."
        });
      }
    }

    const timer = globalThis.setTimeout(() => {
      void run();
    }, 220);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [provider, query]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search stock images"
          className="h-10 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none"
        />
        <div className="flex gap-2">
          {(["all", "unsplash", "pexels"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={provider === option ? "secondary" : "ghost"}
              onClick={() => setProvider(option)}
            >
              {option === "all" ? "All" : option}
            </Button>
          ))}
        </div>
      </div>

      {state.status === "error" ? (
        <div className="rounded-lg border border-rose-300/15 bg-rose-500/5 px-3 py-2 text-xs text-rose-100">
          {state.error}
        </div>
      ) : null}
      {state.status === "loading" ? <p className="text-xs text-white/55">Searching...</p> : null}

      <div className="grid grid-cols-1 gap-3">
        {state.results.map((result) => (
          <StockResultCard
            key={`${result.provider}-${result.assetId}`}
            result={result}
            loading={busyInsertId === `${result.provider}-${result.assetId}`}
            onInsert={(item) => {
              const id = `${item.provider}-${item.assetId}`;
              setBusyInsertId(id);
              void onInsert(item).finally(() => {
                setBusyInsertId((current) => (current === id ? null : current));
              });
            }}
          />
        ))}
        {state.status !== "loading" && state.results.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-4 text-xs text-white/55">
            Search to see stock images from Unsplash/Pexels.
          </p>
        ) : null}
      </div>
    </div>
  );
}
