"use client";

import { useMemo, useState } from "react";
import type { AssetDTO } from "../../lib/dto/asset";
import type { NormalizedStockResult } from "../../lib/stock/types";
import { UploadTab } from "./pickers/UploadTab";
import { StockTab } from "./pickers/StockTab";
import { Button } from "../ui/button";

type Tab = "uploads" | "photos";

export function ImagePicker({
  storybookId,
  open,
  recentAssets,
  selectedFrameLabel,
  onClose,
  onInsertUploadAsset,
  onCreateUploadAsset,
  onInsertStockResult
}: {
  storybookId: string;
  open: boolean;
  recentAssets: AssetDTO[];
  selectedFrameLabel?: string;
  onClose: () => void;
  onInsertUploadAsset: (asset: AssetDTO) => void;
  onCreateUploadAsset: (input: {
    sourceUrl: string;
    storageKey?: string | null;
    mimeType: string;
    width?: number | null;
    height?: number | null;
    sizeBytes: number;
  }) => Promise<{ ok: boolean; asset?: AssetDTO; error?: string }>;
  onInsertStockResult: (result: NormalizedStockResult) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("uploads");
  const uploadCount = useMemo(
    () => recentAssets.filter((asset) => asset.source === "UPLOAD").length,
    [recentAssets]
  );

  if (!open) return null;

  return (
    <aside className="flex h-full w-[360px] flex-col border-r border-white/10 bg-[#0b1320]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Images</p>
            <p className="mt-1 text-sm text-white/80">
              {selectedFrameLabel ? `Insert into ${selectedFrameLabel}` : "Select an image frame"}
            </p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={tab === "uploads" ? "secondary" : "ghost"}
            onClick={() => setTab("uploads")}
          >
            Uploads ({uploadCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "photos" ? "secondary" : "ghost"}
            onClick={() => setTab("photos")}
          >
            Photos
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === "uploads" ? (
          <UploadTab
            storybookId={storybookId}
            recentAssets={recentAssets}
            onCreated={onInsertUploadAsset}
            createUploadAsset={onCreateUploadAsset}
          />
        ) : (
          <StockTab onInsert={onInsertStockResult} />
        )}
      </div>
    </aside>
  );
}
