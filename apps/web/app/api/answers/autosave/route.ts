import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { upsertGuidedChapterAnswerForUser } from "../../../../lib/data/create-flow";
import { isValidTiptapDoc } from "../../../../../../packages/shared/richtext/normalize";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser("/app");

  let body: {
    storybookId?: string;
    chapterInstanceId?: string;
    questionId?: string;
    answerRich?: unknown;
    answerPlain?: string;
    answerText?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const { storybookId, chapterInstanceId, questionId, answerRich, answerPlain, answerText } = body;

  if (!storybookId || !chapterInstanceId || !questionId) {
    return jsonError(400, "storybookId, chapterInstanceId, and questionId are required.");
  }

  const richDoc = isValidTiptapDoc(answerRich) ? answerRich : null;
  const plain = typeof answerPlain === "string" ? answerPlain : null;
  const text = typeof answerText === "string" ? answerText : plain;

  const result = await upsertGuidedChapterAnswerForUser(user.id, {
    storybookId,
    chapterInstanceId,
    questionId,
    answerText: text,
    answerRich: richDoc,
    answerPlain: plain,
    skipped: false,
    source: "text"
  });

  if (!result.ok) return jsonError(500, result.error ?? "Autosave failed.");

  return NextResponse.json({ ok: true });
}
