import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { anyApi, convexAction, getConvexUrl } from "../../../../lib/convex/ops";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser("/app");

  if (!getConvexUrl()) return jsonError(503, "Convex is not configured.");

  let body: { text?: string; action?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const { text, action } = body;
  if (!text || !action) return jsonError(400, "text and action are required.");
  if (typeof text !== "string" || text.trim().length === 0) return jsonError(400, "text must be a non-empty string.");

  const result = await convexAction<{ ok: boolean; result?: string; errorCode?: string; message?: string }>(
    anyApi.ai.textImprove.improve,
    { viewerSubject: user.id, text, action }
  );

  if (!result.ok) return jsonError(500, result.error ?? "AI improve failed.");
  if (!result.data.ok) return jsonError(422, result.data.message ?? "AI improve failed.");

  return NextResponse.json({ ok: true, result: result.data.result });
}
