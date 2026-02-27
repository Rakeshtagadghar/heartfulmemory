"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useRef, useState } from "react";
import { getClientMediaConfig } from "../../lib/config/media";
import {
  prepareClientImageUpload,
  requestUploadSignature,
  uploadImageViaPreparedSignature
} from "../../lib/uploads/clientUpload";
import { TrackedIllustrationActionButton } from "./TrackedIllustrationActionButton";

function toAccept(prefixes: string[]) {
  return prefixes.map((prefix) => (prefix === "image/" ? "image/*" : prefix)).join(",");
}

type UploadedAssetOption = {
  id: string;
  cachedUrl: string;
  thumbUrl: string | null;
  width: number;
  height: number;
};

type ActionResult = { ok: true } | { ok: false; error: string };

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("NEXT_REDIRECT")) return "Session updated. Refreshing...";
    return error.message;
  }
  return "Could not apply uploaded image.";
}

export function UploadImagePicker({
  storybookId,
  slotId,
  uploadedAssets,
  onUploadAndReplace,
  onUseUploadedAsset,
  onUploadOnly,
  title = "Use Your Own Image",
  subtitle = "Upload from your device and apply to this slot.",
  uploadLabel = "Upload & Replace"
}: {
  storybookId: string;
  slotId?: string | null;
  uploadedAssets: UploadedAssetOption[];
  onUploadAndReplace?: (input: {
    slotId: string;
    sourceUrl: string;
    storageKey: string | null;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    fileName: string;
  }) => Promise<ActionResult>;
  onUseUploadedAsset?: (input: { slotId: string; mediaAssetId: string }) => Promise<ActionResult>;
  onUploadOnly?: (input: {
    sourceUrl: string;
    storageKey: string | null;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    fileName: string;
  }) => Promise<ActionResult>;
  title?: string;
  subtitle?: string;
  uploadLabel?: string;
}) {
  const router = useRouter();
  const media = getClientMediaConfig();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" } | { kind: "working"; message: string } | { kind: "error"; message: string }>({
    kind: "idle"
  });
  const [pendingAssetId, setPendingAssetId] = useState<string | null>(null);

  const canReplace = Boolean(slotId && onUploadAndReplace);

  async function handleFilePick(file: File) {
    setStatus({ kind: "working", message: "Preparing image..." });
    let prepared;
    try {
      prepared = await prepareClientImageUpload(file);
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not prepare upload."
      });
      return;
    }

    const signed = await requestUploadSignature({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storybookId
    });
    if (!signed.ok) {
      setStatus({ kind: "error", message: signed.error });
      return;
    }

    setStatus({
      kind: "working",
      message: signed.strategy === "local_dev" ? "Saving upload..." : "Uploading image..."
    });
    const uploaded = await uploadImageViaPreparedSignature({ prepared, sign: signed });
    if (!uploaded.ok) {
      setStatus({ kind: "error", message: uploaded.error });
      return;
    }
    try {
      let result: ActionResult;
      if (canReplace && slotId && onUploadAndReplace) {
        result = await onUploadAndReplace({
          slotId,
          sourceUrl: uploaded.sourceUrl,
          storageKey: uploaded.storageKey,
          mimeType: file.type || "image/*",
          width: prepared.width,
          height: prepared.height,
          sizeBytes: file.size,
          fileName: file.name
        });
      } else if (onUploadOnly) {
        result = await onUploadOnly({
          sourceUrl: uploaded.sourceUrl,
          storageKey: uploaded.storageKey,
          mimeType: file.type || "image/*",
          width: prepared.width,
          height: prepared.height,
          sizeBytes: file.size,
          fileName: file.name
        });
      } else {
        throw new Error("Upload action is not configured.");
      }
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error || "Could not apply uploaded image." });
        return;
      }
    } catch (error) {
      const message = getActionErrorMessage(error);
      if (message === "Session updated. Refreshing...") {
        setStatus({ kind: "working", message });
        router.refresh();
        return;
      }
      setStatus({
        kind: "error",
        message
      });
      return;
    }
    setStatus({ kind: "idle" });
    router.refresh();
  }

  async function applyUploadedAsset(mediaAssetId: string) {
    if (!slotId || !onUseUploadedAsset) return;
    setPendingAssetId(mediaAssetId);
    setStatus({ kind: "idle" });
    try {
      const result = await onUseUploadedAsset({ slotId, mediaAssetId });
      if (!result.ok) {
        setPendingAssetId(null);
        setStatus({ kind: "error", message: result.error || "Could not apply uploaded image." });
        return;
      }
      setPendingAssetId(null);
      router.refresh();
    } catch (error) {
      const message = getActionErrorMessage(error);
      if (message === "Session updated. Refreshing...") {
        setStatus({ kind: "working", message });
        router.refresh();
        return;
      }
      setPendingAssetId(null);
      setStatus({
        kind: "error",
        message
      });
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-parchment">{title}</p>
          <p className="text-xs text-white/55">{subtitle}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={toAccept(media.uploads.allowedMimePrefixes)}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFilePick(file);
            }
            event.currentTarget.value = "";
          }}
        />
        <TrackedIllustrationActionButton
          type="button"
          size="sm"
          variant="secondary"
          loading={status.kind === "working"}
          eventName="illustration_upload_replace"
          eventProps={{ slotId }}
          onClick={() => inputRef.current?.click()}
        >
          {uploadLabel}
        </TrackedIllustrationActionButton>
      </div>

      <p className="mt-2 text-[11px] text-white/50">
        Max {media.uploads.maxUploadMb}MB. Allowed: {toAccept(media.uploads.allowedMimePrefixes)}.
      </p>

      {status.kind === "working" ? (
        <div className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100">
          {status.message}
        </div>
      ) : null}
      {status.kind === "error" ? (
        <div className="mt-3 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {status.message}
        </div>
      ) : null}

      {slotId && onUseUploadedAsset && uploadedAssets.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Your uploads</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {uploadedAssets.slice(0, 9).map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] text-left transition hover:border-gold/45 hover:bg-white/[0.05]"
                onClick={() => {
                  void applyUploadedAsset(asset.id);
                }}
                disabled={pendingAssetId === asset.id}
                title="Use this uploaded image"
              >
                <Image
                  src={asset.thumbUrl ?? asset.cachedUrl}
                  alt="Uploaded image"
                  width={Math.max(1, asset.width || 800)}
                  height={Math.max(1, asset.height || 600)}
                  unoptimized
                  className="h-28 w-full object-cover"
                />
                <div className="px-2 py-2 text-[11px] text-white/65">
                  {asset.width} x {asset.height}
                  {pendingAssetId === asset.id ? " - applying..." : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
