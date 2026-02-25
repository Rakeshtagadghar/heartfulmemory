import type { NormalizedStockResult } from "../types";

function mockUnsplash(q: string): NormalizedStockResult[] {
  const query = encodeURIComponent(q || "memory");
  const base = `https://images.unsplash.com`;
  const pics = [
    `${base}/photo-1515934751635-c81c6bc9a2d8`,
    `${base}/photo-1500530855697-b586d89ba3ee`,
    `${base}/photo-1469474968028-56623f02e42e`,
    `${base}/photo-1470770841072-f978cf4d019e`
  ];
  return pics.map((url, index) => ({
    provider: "unsplash",
    assetId: `mock-unsplash-${index}-${query}`,
    thumbUrl: `${url}?w=400&h=300&fit=crop&auto=format`,
    previewUrl: `${url}?w=1200&auto=format`,
    fullUrl: `${url}?w=2200&auto=format`,
    width: null,
    height: null,
    authorName: "Unsplash Photographer",
    authorUrl: "https://unsplash.com",
    sourceUrl: `https://unsplash.com/s/photos/${query}`,
    licenseName: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    requiresAttribution: false,
    attributionText: "Photo from Unsplash"
  }));
}

export async function searchUnsplash(q: string, page = 1): Promise<NormalizedStockResult[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return mockUnsplash(q);
  }

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", q || "memory");
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", "24");
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`
    },
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Unsplash search failed (${res.status})`);
  }
  const data = (await res.json()) as {
    results?: Array<{
      id: string;
      width?: number;
      height?: number;
      urls?: { thumb?: string; regular?: string; full?: string };
      links?: { html?: string };
      user?: { name?: string; links?: { html?: string } };
    }>;
  };

  return (data.results ?? []).map((item) => ({
    provider: "unsplash",
    assetId: item.id,
    thumbUrl: item.urls?.thumb ?? item.urls?.regular ?? "",
    previewUrl: item.urls?.regular ?? item.urls?.thumb ?? "",
    fullUrl: item.urls?.full ?? item.urls?.regular ?? null,
    width: item.width ?? null,
    height: item.height ?? null,
    authorName: item.user?.name ?? "Unsplash Photographer",
    authorUrl: item.user?.links?.html ?? null,
    sourceUrl: item.links?.html ?? null,
    licenseName: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    requiresAttribution: false,
    attributionText: `Photo by ${item.user?.name ?? "Unsplash contributor"} on Unsplash`
  }));
}
