import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getMediaConfig } from "../../../../lib/config/media";
import { searchUnsplash } from "../../../../lib/photos/providers/unsplash";
import { searchPexels } from "../../../../lib/photos/providers/pexels";
import type { NormalizedStockResult, StockProviderId } from "../../../../lib/stock/types";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

type ProviderFilter = "all" | StockProviderId;

function parseProvider(value: string | null): ProviderFilter | null {
  const normalized = (value ?? "all").toLowerCase();
  if (normalized === "unsplash" || normalized === "pexels") return normalized;
  if (normalized === "all") return "all";
  return null;
}

export async function GET(request: Request) {
  await requireAuthenticatedUser("/app");
  const config = getMediaConfig();
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const perPage = Math.min(
    config.photos.maxPerPage,
    Math.max(1, Number(url.searchParams.get("perPage") ?? String(config.photos.defaultPerPage)) || config.photos.defaultPerPage)
  );
  const parsedProvider = parseProvider(url.searchParams.get("provider"));
  if (!parsedProvider) {
    return jsonError(400, "Invalid provider. Use all, unsplash, or pexels.");
  }
  let provider = parsedProvider;
  if (config.photos.providerEnabled !== "all") {
    provider = config.photos.providerEnabled;
  }

  if (!q) {
    return jsonError(400, "q is required.");
  }

  try {
    let results: NormalizedStockResult[] = [];
    if (provider === "unsplash") {
      results = await searchUnsplash(q, page);
    } else if (provider === "pexels") {
      results = await searchPexels(q, page);
    } else {
      const [unsplash, pexels] = await Promise.all([searchUnsplash(q, page), searchPexels(q, page)]);
      results = [...unsplash, ...pexels];
    }

    return NextResponse.json({
      ok: true,
      provider,
      page,
      perPage,
      results: results.slice(0, perPage)
    });
  } catch (error) {
    return jsonError(500, error instanceof Error ? error.message : "Photos search failed.");
  }
}
