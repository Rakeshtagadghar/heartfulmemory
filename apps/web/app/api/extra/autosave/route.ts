import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { setExtraAnswerForUser } from "../../../../lib/data/create-flow";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser("/app");

  let body: { storybookId?: string; text?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const { storybookId, text } = body;
  if (!storybookId) {
    return jsonError(400, "storybookId is required.");
  }

  const plainText = typeof text === "string" ? text : null;

  const result = await setExtraAnswerForUser(user.id, storybookId, {
    text: plainText,
    skipped: false
  });

  if (!result.ok) return jsonError(500, result.error ?? "Autosave failed.");

  return NextResponse.json({ ok: true });
}
