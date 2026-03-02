"use client";

import { useRef, useState } from "react";
import { PhotoGrid, type PhotoItem } from "./PhotoGrid";
import { PopulateProgress } from "./PopulateProgress";
import { prepareClientImageUpload, requestUploadSignature, uploadImageViaPreparedSignature } from "../../lib/uploads/clientUpload";

const MAX_PHOTOS = 20;

export type AddPhotoInput = {
  storageKey: string | null;
  sourceUrl: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
};

export function StoryPhotoUploader({
  storybookId,
  initialPhotos,
  addPhotoAction,
  removePhotoAction,
  continueAction,
  skipAction
}: {
  storybookId: string;
  initialPhotos: PhotoItem[];
  addPhotoAction: (input: AddPhotoInput) => Promise<{ ok: boolean; id?: string; orderIndex?: number; error?: string }>;
  removePhotoAction: (photoId: string) => Promise<{ ok: boolean }>;
  continueAction: () => Promise<void>;
  skipAction: () => Promise<void>;
}) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [populating, setPopulating] = useState(false);
  const [populateError, setPopulateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos already uploaded.`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      try {
        const prepared = await prepareClientImageUpload(file);
        const sign = await requestUploadSignature({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          storybookId
        });
        if (!sign.ok) {
          setUploadError(sign.error);
          break;
        }
        const uploaded = await uploadImageViaPreparedSignature({ prepared, sign });
        if (!uploaded.ok) {
          setUploadError(uploaded.error);
          break;
        }

        // Create asset + storybookPhotos row via server action
        const result = await addPhotoAction({
          storageKey: uploaded.storageKey ?? null,
          sourceUrl: uploaded.sourceUrl,
          mimeType: file.type,
          width: prepared.width,
          height: prepared.height,
          sizeBytes: file.size
        });
        if (!result.ok || !result.id) {
          setUploadError(result.error ?? "Could not save photo.");
          break;
        }

        const newPhoto: PhotoItem = {
          id: result.id,
          orderIndex: result.orderIndex ?? photos.length,
          sourceUrl: uploaded.sourceUrl,
          previewUrl: prepared.previewUrl
        };
        setPhotos((prev) => [...prev, newPhoto]);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
        break;
      }
    }

    setUploading(false);
  }

  async function handleRemove(photoId: string) {
    const result = await removePhotoAction(photoId);
    if (result.ok) {
      setPhotos((prev) =>
        prev
          .filter((p) => p.id !== photoId)
          .map((p, i) => ({ ...p, orderIndex: i }))
      );
    }
  }

  async function handleContinue() {
    setPopulating(true);
    setPopulateError(null);
    try {
      await continueAction();
    } catch (err) {
      setPopulateError(err instanceof Error ? err.message : "Could not prepare studio. Please try again.");
      setPopulating(false);
    }
  }

  async function handleSkip() {
    setPopulating(true);
    setPopulateError(null);
    try {
      await skipAction();
    } catch (err) {
      setPopulateError(err instanceof Error ? err.message : "Could not continue. Please try again.");
      setPopulating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Upload your photos</p>
        <h1 className="mt-2 font-display text-2xl text-parchment sm:text-3xl">Add photos to your story</h1>
        <p className="mt-2 text-sm text-white/60">
          Upload up to {MAX_PHOTOS} photos. They&apos;ll be placed into your storybook pages in order.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4">
        <PhotoGrid photos={photos} maxPhotos={MAX_PHOTOS} onRemove={handleRemove} />

        {photos.length < MAX_PHOTOS ? (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading || populating}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || populating}
              className="inline-flex cursor-pointer h-12 items-center justify-center rounded-xl border border-dashed border-white/25 px-6 text-sm font-semibold text-white/70 hover:border-white/40 hover:text-white disabled:opacity-40"
            >
              {uploading ? "Uploading…" : "+ Add photos"}
            </button>
          </div>
        ) : null}

        {uploadError ? (
          <p className="text-sm text-rose-100">{uploadError}</p>
        ) : null}
      </div>

      {populating ? (
        <PopulateProgress error={populateError} onRetry={handleContinue} />
      ) : null}

      <div className="sticky bottom-3 z-10 rounded-xl border border-white/10 bg-[#0f1118]/80 p-4 backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSkip}
            disabled={populating}
            className="inline-flex cursor-pointer h-12 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/55 hover:bg-white/[0.03] disabled:opacity-40"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={populating || photos.length === 0}
            className="inline-flex cursor-pointer h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#d5b36a,#c9a84c)] px-6 text-sm font-semibold text-[#1a1409] hover:opacity-90 disabled:opacity-40"
          >
            {populating ? "Preparing studio…" : "Continue to Studio"}
          </button>
        </div>
      </div>
    </div>
  );
}
