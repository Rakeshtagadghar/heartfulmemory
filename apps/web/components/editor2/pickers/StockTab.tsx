"use client";

import { useEffect, useMemo, useState } from "react";
import type { NormalizedStockResult, StockProviderId } from "../../../lib/stock/types";
import { getClientMediaConfig } from "../../../lib/config/media";
import { Button } from "../../ui/button";
import { PanelEmptyState, PanelErrorState, PanelSkeletonGrid } from "../../studio/ui/PanelStates";
import { showStudioToast } from "../../studio/ui/toasts";
import { StockResultCard } from "./StockResultCard";

type StockState =
  | { status: "idle"; results: NormalizedStockResult[] }
  | { status: "loading"; results: NormalizedStockResult[] }
  | { status: "error"; results: NormalizedStockResult[]; error: string };

type ProviderFilter = "all" | StockProviderId;

const clientMedia = getClientMediaConfig();

export function StockTab({
  onInsert
}: {
  onInsert: (result: NormalizedStockResult) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<ProviderFilter>(
    clientMedia.photos.providerEnabled === "all" ? "all" : clientMedia.photos.providerEnabled
  );
  const [page, setPage] = useState(1);
  const [state, setState] = useState<StockState>({ status: "idle", results: [] });
  const [busyInsertId, setBusyInsertId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const providerOptions = useMemo(() => {
    if (clientMedia.photos.providerEnabled === "all") {
      return ["all", "unsplash", "pexels"] as const;
    }
    return [clientMedia.photos.providerEnabled] as const;
  }, []);

  useEffect(() => {
    setPage(1);
  }, [provider, query]);

  useEffect(() => {
    let cancelled = false;
    const isSearch = Boolean(query.trim());
    const endpoint = isSearch ? "/api/photos/search" : "/api/photos/trending";

    async function run() {
      setState((current) => ({
        status: "loading",
        results: page === 1 ? current.results : current.results
      }));
      try {
        const url = new URL(endpoint, globalThis.location.origin);
        if (isSearch) {
          url.searchParams.set("q", query.trim());
        }
        url.searchParams.set("provider", provider);
        url.searchParams.set("page", String(page));
        url.searchParams.set("perPage", String(clientMedia.photos.defaultPerPage));
        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          results?: NormalizedStockResult[];
          error?: string;
        };
        if (cancelled) return;
      if (!res.ok || !data.ok) {
        setState((current) => ({
          status: "error",
          results: page === 1 ? [] : current.results,
          error: data.error || "Photo search failed."
        }));
        showStudioToast({ kind: "error", title: "Photos unavailable", message: data.error || "Photo search failed." });
        return;
      }
        const incoming = data.results ?? [];
        setState((current) => {
          const merged =
            page === 1
              ? incoming
              : [...current.results, ...incoming].filter(
                  (result, index, all) =>
                    all.findIndex((candidate) => candidate.provider === result.provider && candidate.assetId === result.assetId) ===
                    index
                );
          return { status: "idle", results: merged };
        });
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          status: "error",
          results: page === 1 ? [] : current.results,
          error:
            error instanceof Error
              ? `Photos request failed: ${error.message}`
              : "Photos request failed. Check your network and try again."
        }));
        showStudioToast({
          kind: "error",
          title: "Photos request failed",
          message: error instanceof Error ? error.message : "Check your network and try again."
        });
      }
    }

    const delayMs = isSearch ? 250 : 50;
    const timer = globalThis.setTimeout(() => {
      void run();
    }, delayMs);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [nonce, page, provider, query]);

  const emptyMessage = query.trim()
    ? "No matching photos found. Try another search."
    : "Trending photos will appear here.";

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search photos"
          className="h-10 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {providerOptions.map((option) => (
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
          <Button type="button" size="sm" variant="ghost" onClick={() => setNonce((value) => value + 1)}>
            Retry
          </Button>
        </div>
      </div>

      {state.status === "error" ? (
        <PanelErrorState message={state.error} onRetry={() => setNonce((v) => v + 1)} />
      ) : null}

      {state.status === "loading" && state.results.length === 0 ? (
        <PanelSkeletonGrid items={4} />
      ) : null}

      {state.status !== "loading" && state.results.length === 0 ? (
        <PanelEmptyState
          title={query.trim() ? "No results" : "Trending photos"}
          description={emptyMessage}
          actionLabel="Retry"
          onAction={() => setNonce((value) => value + 1)}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        {state.results.map((result) => (
          <StockResultCard
            key={`${result.provider}-${result.assetId}`}
            result={result}
            loading={busyInsertId === `${result.provider}-${result.assetId}`}
            onInsert={(item) => {
              const id = `${item.provider}-${item.assetId}`;
              if (busyInsertId === id) return;
              setBusyInsertId(id);
              void onInsert(item).finally(() => {
                setBusyInsertId((current) => (current === id ? null : current));
              });
            }}
          />
        ))}
      </div>

      {state.results.length > 0 ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-full"
          loading={state.status === "loading" && state.results.length > 0}
          onClick={() => setPage((current) => current + 1)}
        >
          Load more
        </Button>
      ) : null}
    </div>
  );
}
