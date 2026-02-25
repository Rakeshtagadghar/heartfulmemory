"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import type { AssetDTO } from "../../../lib/dto/asset";
import { getClientMediaConfig } from "../../../lib/config/media";
import {
  prepareClientImageUpload,
  requestUploadSignature,
  uploadImageViaPreparedSignature
} from "../../../lib/uploads/clientUpload";
import { Button } from "../../ui/button";
import { PanelEmptyState, PanelErrorState } from "../../studio/ui/PanelStates";
import { showStudioToast } from "../../studio/ui/toasts";
import { setDraggedMediaPayload } from "../../studio/dnd/frameDropTarget";

type UploadStatus =
  | { status: "idle" }
  | { status: "working"; message: string }
  | { status: "error"; error: string };

function fileAcceptFromMimePrefixes(prefixes: string[]) {
  return prefixes
    .map((value) => (value === "image/" ? "image/*" : value))
    .join(",");
}

function getUploadThumbnailSrc(asset: AssetDTO) {
  if (asset.storage_provider === "R2") {
    return `/api/assets/view/${asset.id}?purpose=preview`;
  }
  const sourceUrl = typeof asset.source_url === "string" ? asset.source_url.trim() : "";
  return sourceUrl.length > 0 ? sourceUrl : null;
}

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
  const mediaConfig = getClientMediaConfig();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [upload, setUpload] = useState<UploadStatus>({ status: "idle" });
  const [retryFile, setRetryFile] = useState<File | null>(null);

  async function onPickFile(file: File) {
    setRetryFile(file);
    setUpload({ status: "working", message: "Preparing image..." });
    let prepared;
    try {
      prepared = await prepareClientImageUpload(file);
    } catch (error) {
      setUpload({
        status: "error",
        error: error instanceof Error ? error.message : "Could not prepare image upload."
      });
      return;
    }

    const sign = await requestUploadSignature({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storybookId
    });
    if (!sign.ok) {
      setUpload({ status: "error", error: sign.error });
      showStudioToast({ kind: "error", title: "Upload failed", message: sign.error });
      return;
    }

    setUpload({
      status: "working",
      message: sign.strategy === "local_dev" ? "Saving local dev asset..." : "Uploading..."
    });
    const uploaded = await uploadImageViaPreparedSignature({ prepared, sign });
    if (!uploaded.ok) {
      setUpload({ status: "error", error: uploaded.error });
      showStudioToast({ kind: "error", title: "Upload failed", message: uploaded.error });
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
      const message = created.error || "Could not create asset metadata.";
      setUpload({ status: "error", error: message });
      showStudioToast({ kind: "error", title: "Upload failed", message });
      return;
    }

    setUpload({ status: "idle" });
    setRetryFile(null);
    showStudioToast({ kind: "success", title: "Image uploaded", message: "Inserted into the page." });
    onCreated(created.asset);
  }

  const uploadAssets = recentAssets.filter(
    (asset) => asset.source === "UPLOAD" && typeof asset.source_url === "string"
  );

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={fileAcceptFromMimePrefixes(mediaConfig.uploads.allowedMimePrefixes)}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void onPickFile(file);
          }
          event.currentTarget.value = "";
        }}
      />

      <Button
        type="button"
        className="w-full"
        loading={upload.status === "working"}
        disabled={upload.status === "working"}
        onClick={() => inputRef.current?.click()}
      >
        Upload files
      </Button>

      <p className="text-[11px] text-white/50">
        Max {mediaConfig.uploads.maxUploadMb}MB · {fileAcceptFromMimePrefixes(mediaConfig.uploads.allowedMimePrefixes)}
      </p>

      {upload.status === "working" ? (
        <div className="space-y-2 rounded-lg border border-cyan-300/15 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100">
          <p>{upload.message}</p>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-300/80" />
          </div>
        </div>
      ) : null}

      {upload.status === "error" ? (
        <PanelErrorState
          message={upload.error}
          onRetry={retryFile ? () => void onPickFile(retryFile) : undefined}
        />
      ) : null}

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-white/45">Uploads Library</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {uploadAssets.slice(0, 20).map((asset) => {
            const thumbnailSrc = getUploadThumbnailSrc(asset);
            return (
              <button
                key={asset.id}
                type="button"
                draggable
                className="group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] text-left"
                onClick={() => onCreated(asset)}
                onDragStart={(event) => {
                  setDraggedMediaPayload(event.dataTransfer, { kind: "asset", assetId: asset.id });
                  event.dataTransfer.effectAllowed = "copy";
                }}
              >
                <div className="aspect-square bg-black/20">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt="Uploaded asset"
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-white/45">
                      Preview unavailable
                    </div>
                  )}
                </div>
                <div className="px-2 py-1 text-[11px] text-white/65">
                  {asset.width ?? "?"}×{asset.height ?? "?"}
                </div>
              </button>
            );
          })}
          {uploadAssets.length === 0 ? (
            <div className="col-span-2">
              <PanelEmptyState
                title="No uploads yet"
                description="Upload a PNG, JPG, or WebP to insert it on the page."
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
