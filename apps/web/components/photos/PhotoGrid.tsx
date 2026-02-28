"use client";

import Image from "next/image";

export type PhotoItem = {
  id: string;
  orderIndex: number;
  sourceUrl: string | null;
  previewUrl?: string; // local preview before upload completes
};

export function PhotoGrid({
  photos,
  maxPhotos,
  onRemove
}: {
  photos: PhotoItem[];
  maxPhotos: number;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-white/60">
        {photos.length}/{maxPhotos} photos
      </p>
      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">
          No photos yet. Upload up to {maxPhotos} photos below.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => {
            const url = photo.previewUrl ?? photo.sourceUrl;
            return (
              <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                {url ? (
                  <Image
                    src={url}
                    alt={`Photo ${photo.orderIndex + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-xs text-white/30">Loading...</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(photo.id)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/90 hover:bg-black/80"
                  aria-label="Remove photo"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 4 4 12M4 4l8 8" />
                  </svg>
                </button>
                <span className="absolute bottom-1 left-1.5 rounded bg-black/50 px-1 py-0.5 text-[10px] text-white/70">
                  {photo.orderIndex + 1}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
