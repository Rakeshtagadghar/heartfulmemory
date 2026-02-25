import { ExportImageCache } from "../utils/imageCache";

export type ImageFetchInput = {
  key: string;
  url: string;
  mimeType?: string | null;
  cache?: ExportImageCache;
};

export async function fetchImageBytes(input: ImageFetchInput) {
  const cache = input.cache;
  const loader = async () => {
    const response = await fetch(input.url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Image fetch failed (${response.status}) for ${input.url}`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { key: input.key, bytes, mimeType: input.mimeType ?? response.headers.get("content-type") };
  };
  if (!cache) return loader();
  return cache.getOrLoad(input.key, loader);
}

