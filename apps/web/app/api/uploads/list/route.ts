import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { storageAdapter } from "../../../../lib/storage/storageAdapter";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser("/app");
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "40");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 40;

  try {
    const uploads = await storageAdapter.listUploads(user.id, limit);
    return NextResponse.json({ ok: true, uploads });
  } catch (error) {
    return jsonError(500, error instanceof Error ? error.message : "Could not list uploads.");
  }
}
