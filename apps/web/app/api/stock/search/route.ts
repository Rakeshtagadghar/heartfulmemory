import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { searchUnsplash } from "../../../../lib/stock/providers/unsplash";
import { searchPexels } from "../../../../lib/stock/providers/pexels";
import type { NormalizedStockResult } from "../../../../lib/stock/types";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(request: Request) {
  await requireAuthenticatedUser("/app");

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const page = Number(url.searchParams.get("page") ?? "1");
  const provider = (url.searchParams.get("provider") ?? "all").toLowerCase();

  if (!q) {
    return NextResponse.json({ ok: true, results: [] satisfies NormalizedStockResult[] });
  }

  try {
    let results: NormalizedStockResult[] = [];
    if (provider === "unsplash") {
      results = await searchUnsplash(q, page);
    } else if (provider === "pexels") {
      results = await searchPexels(q, page);
    } else {
      const [unsplash, pexels] = await Promise.all([
        searchUnsplash(q, page),
        searchPexels(q, page)
      ]);
      results = [...unsplash, ...pexels];
    }

    return NextResponse.json({
      ok: true,
      results
    });
  } catch (error) {
    return jsonError(500, error instanceof Error ? error.message : "Stock search failed.");
  }
}
