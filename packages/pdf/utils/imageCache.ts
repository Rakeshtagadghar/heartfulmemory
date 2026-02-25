export type ImageCacheEntry = {
  key: string;
  bytes: Uint8Array;
  mimeType?: string | null;
};

export class ExportImageCache {
  private readonly store = new Map<string, Promise<ImageCacheEntry>>();

  get(key: string) {
    return this.store.get(key) ?? null;
  }

  set(key: string, loader: Promise<ImageCacheEntry>) {
    this.store.set(key, loader);
    return loader;
  }

  getOrLoad(key: string, loader: () => Promise<ImageCacheEntry>) {
    const existing = this.store.get(key);
    if (existing) return existing;
    const pending = loader();
    this.store.set(key, pending);
    return pending;
  }
}

