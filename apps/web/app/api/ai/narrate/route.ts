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

  let body: {
    questionPrompt?: string;
    answerText?: string;
    chapterTitle?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const { questionPrompt, answerText, chapterTitle } = body;
  if (!questionPrompt || !answerText || !chapterTitle) {
    return jsonError(400, "questionPrompt, answerText, and chapterTitle are required.");
  }

  const result = await convexAction<{ ok: boolean; narratedText?: string; errorCode?: string; message?: string }>(
    anyApi.ai.answersNarrate.narrate,
    { viewerSubject: user.id, questionPrompt, answerText, chapterTitle }
  );

  if (!result.ok) return jsonError(500, result.error ?? "AI narrate failed.");
  if (!result.data.ok) return jsonError(422, result.data.message ?? "AI narrate failed.");

  return NextResponse.json({ ok: true, narratedText: result.data.narratedText });
}
