import limits from "../../config/limits.default.json";

type PhotosProvider = "all" | "unsplash" | "pexels";

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function parseCsv(value: string | undefined, fallback: string[]) {
  if (!value?.trim()) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getMediaConfig() {
  const maxUploadMb = parsePositiveInt(
    process.env.MAX_UPLOAD_MB ?? process.env.R2_UPLOAD_MAX_MB,
    Math.round(limits.uploads.imageMaxBytes / (1024 * 1024))
  );
  const allowedMimePrefixes = parseCsv(process.env.ALLOWED_MIME_TYPES, limits.uploads.allowedMimePrefixes);
  const photosProviderEnabled = (process.env.PHOTOS_PROVIDER_ENABLED ?? "all").toLowerCase();
  const uploadsPerUser = parsePositiveInt(process.env.MAX_UPLOADS_PER_USER, 0);
  const photosPerPage = Math.min(50, parsePositiveInt(process.env.PHOTOS_PER_PAGE, 24));

  return {
    uploads: {
      maxUploadMb,
      maxUploadBytes: maxUploadMb * 1024 * 1024,
      allowedMimePrefixes,
      maxUploadsPerUser: uploadsPerUser > 0 ? uploadsPerUser : null
    },
    photos: {
      providerEnabled: (["all", "unsplash", "pexels"].includes(photosProviderEnabled)
        ? photosProviderEnabled
        : "all") as PhotosProvider,
      defaultPerPage: photosPerPage,
      maxPerPage: 50
    }
  };
}

export function getClientMediaConfig() {
  const config = getMediaConfig();
  return {
    uploads: {
      maxUploadMb: config.uploads.maxUploadMb,
      allowedMimePrefixes: config.uploads.allowedMimePrefixes
    },
    photos: config.photos
  };
}
