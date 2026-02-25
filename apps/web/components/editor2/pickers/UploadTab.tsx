"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import type { AssetDTO } from "../../../lib/dto/asset";
import {
  prepareClientImageUpload,
  requestUploadSignature,
  uploadImageViaPreparedSignature
} from "../../../lib/uploads/clientUpload";
import { Button } from "../../ui/button";

type UploadStatus =
  | { status: "idle" }
  | { status: "working"; message: string }
  | { status: "error"; error: string };

export function UploadTab({
  storybookId,
  recentAssets,
  onCreated,
  createUploadAsset
}: {
  storybookId: string;
  recentAssets: AssetDTO[];
  onCreated: (asset: AssetDTO) => void;
  createUploadAsset: (input: {
    sourceUrl: string;
    storageKey?: string | null;
    mimeType: string;
    width?: number | null;
    height?: number | null;
    sizeBytes: number;
  }) => Promise<{ ok: boolean; asset?: AssetDTO; error?: string }>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [upload, setUpload] = useState<UploadStatus>({ status: "idle" });
  const [retryFile, setRetryFile] = useState<File | null>(null);

  async function onPickFile(file: File) {
    setRetryFile(file);
    setUpload({ status: "working", message: "Preparing image..." });
    const prepared = await prepareClientImageUpload(file);

    const sign = await requestUploadSignature({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storybookId
    });
    if (!sign.ok) {
      setUpload({ status: "error", error: sign.error });
      return;
    }

    setUpload({ status: "working", message: sign.strategy === "local_dev" ? "Saving local dev asset..." : "Uploading..." });
    const uploaded = await uploadImageViaPreparedSignature({ prepared, sign });
    if (!uploaded.ok) {
      setUpload({ status: "error", error: uploaded.error });
      return;
    }

    const created = await createUploadAsset({
      sourceUrl: uploaded.sourceUrl,
      storageKey: uploaded.storageKey,
      mimeType: file.type || "image/*",
      width: prepared.width,
      height: prepared.height,
      sizeBytes: file.size
    });
    if (!created.ok || !created.asset) {
      setUpload({ status: "error", error: created.error || "Could not create asset metadata." });
      return;
    }

    setUpload({ status: "idle" });
    setRetryFile(null);
    onCreated(created.asset);
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void onPickFile(file);
          }
          event.currentTarget.value = "";
        }}
      />
      <Button type="button" className="w-full" onClick={() => inputRef.current?.click()}>
        Upload Image
      </Button>

      {upload.status === "working" ? (
        <div className="space-y-2 rounded-lg border border-cyan-300/15 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100">
          <p>{upload.message}</p>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-300/80" />
          </div>
        </div>
      ) : null}
      {upload.status === "error" ? (
        <div className="space-y-2 rounded-lg border border-rose-300/15 bg-rose-500/5 px-3 py-2 text-xs text-rose-100">
          <p>{upload.error}</p>
          {retryFile ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => void onPickFile(retryFile)}>
              Retry Upload
            </Button>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Recent Uploads</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {recentAssets
            .filter((asset) => asset.source === "UPLOAD" && typeof asset.source_url === "string")
            .slice(0, 12)
            .map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] text-left"
                onClick={() => onCreated(asset)}
              >
                <div className="aspect-square bg-black/20">
                  <img
                    src={asset.source_url ?? ""}
                    alt="Uploaded asset"
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="px-2 py-1 text-[11px] text-white/65">
                  {asset.width ?? "?"}×{asset.height ?? "?"}
                </div>
              </button>
            ))}
          {recentAssets.filter((asset) => asset.source === "UPLOAD").length === 0 ? (
            <p className="col-span-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-4 text-xs text-white/55">
              No uploads yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
