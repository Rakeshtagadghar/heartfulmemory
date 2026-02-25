"use client";

import type { AssetDTO } from "../dto/asset";
import { getClientMediaConfig } from "../config/media";

export type ClientUploadPrepared = {
  file: File;
  width: number | null;
  height: number | null;
  previewUrl: string;
};

type SignResponse =
  | {
      ok: true;
      strategy: "local_dev" | "r2_put";
      uploadUrl: string | null;
      key: string;
      headersRequired: Record<string, string>;
      maxBytes?: number;
    }
  | { ok: false; error: string };

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

export async function prepareClientImageUpload(file: File): Promise<ClientUploadPrepared> {
  const mediaConfig = getClientMediaConfig();
  if (!mediaConfig.uploads.allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > mediaConfig.uploads.maxUploadMb * 1024 * 1024) {
    throw new Error(`File is too large. Max ${mediaConfig.uploads.maxUploadMb}MB.`);
  }

  const previewUrl = await readAsDataUrl(file);
  let size: { width: number; height: number } | null = null;
  try {
    size = await readImageSize(previewUrl);
  } catch {
    size = null;
  }
  return {
    file,
    previewUrl,
    width: size?.width ?? null,
    height: size?.height ?? null
  };
}

export async function requestUploadSignature(input: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storybookId?: string | null;
}): Promise<SignResponse> {
  try {
    const res = await fetch("/api/uploads/r2/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = (await res.json()) as SignResponse & { error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Could not prepare upload." };
    }
    return data;
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Could not prepare upload: ${error.message}`
          : "Could not prepare upload. Check your network."
    };
  }
}

export async function uploadImageViaPreparedSignature(input: {
  prepared: ClientUploadPrepared;
  sign: Extract<SignResponse, { ok: true }>;
}): Promise<{
  ok: true;
  storageProvider: "LOCAL_DEV" | "R2";
  sourceUrl: string;
  storageKey: string | null;
} | { ok: false; error: string }> {
  const { prepared, sign } = input;

  if (sign.strategy === "local_dev" || !sign.uploadUrl) {
    return {
      ok: true,
      storageProvider: "LOCAL_DEV",
      sourceUrl: prepared.previewUrl,
      storageKey: null
    };
  }

  let putRes: Response;
  try {
    putRes = await fetch(sign.uploadUrl, {
      method: "PUT",
      headers: {
        "content-type": prepared.file.type,
        ...sign.headersRequired
      },
      body: prepared.file
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Upload request failed: ${error.message}. Check R2 CORS and network.`
          : "Upload request failed. Check R2 CORS and network."
    };
  }
  if (!putRes.ok) {
    return { ok: false, error: `Upload failed (${putRes.status}). Check R2 CORS/presigned URL.` };
  }

  const sourceUrl = "";

  return {
    ok: true,
    storageProvider: "R2",
    sourceUrl,
    storageKey: sign.key
  };
}

export type UploadedAssetSelection = {
  asset: AssetDTO;
  previewUrl: string;
};
