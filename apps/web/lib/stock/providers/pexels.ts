import type { NormalizedStockResult } from "../types";

function mockPexels(q: string): NormalizedStockResult[] {
  const query = encodeURIComponent(q || "memory");
  const images = [
    "https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg",
    "https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg",
    "https://images.pexels.com/photos/733856/pexels-photo-733856.jpeg"
  ];
  return images.map((url, index) => ({
    provider: "pexels",
    assetId: `mock-pexels-${index}-${query}`,
    thumbUrl: `${url}?auto=compress&cs=tinysrgb&w=400`,
    previewUrl: `${url}?auto=compress&cs=tinysrgb&w=1200`,
    fullUrl: `${url}?auto=compress&cs=tinysrgb&w=2400`,
    width: null,
    height: null,
    authorName: "Pexels Photographer",
    authorUrl: "https://www.pexels.com",
    sourceUrl: "https://www.pexels.com",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
    requiresAttribution: false,
    attributionText: "Photo from Pexels"
  }));
}

export async function searchPexels(q: string, page = 1): Promise<NormalizedStockResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return mockPexels(q);
  }

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", q || "memory");
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", "24");

  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Pexels search failed (${res.status})`);
  }
  const data = (await res.json()) as {
    photos?: Array<{
      id: number;
      width?: number;
      height?: number;
      url?: string;
      photographer?: string;
      photographer_url?: string;
      src?: { tiny?: string; medium?: string; large2x?: string; original?: string };
    }>;
  };

  return (data.photos ?? []).map((item) => ({
    provider: "pexels",
    assetId: String(item.id),
    thumbUrl: item.src?.tiny ?? item.src?.medium ?? "",
    previewUrl: item.src?.medium ?? item.src?.large2x ?? "",
    fullUrl: item.src?.large2x ?? item.src?.original ?? null,
    width: item.width ?? null,
    height: item.height ?? null,
    authorName: item.photographer ?? "Pexels Photographer",
    authorUrl: item.photographer_url ?? null,
    sourceUrl: item.url ?? null,
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
    requiresAttribution: false,
    attributionText: `Photo by ${item.photographer ?? "Pexels contributor"} on Pexels`
  }));
}
