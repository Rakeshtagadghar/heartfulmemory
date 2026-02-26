import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { transcribeAudioForUser } from "../../../../lib/stt/client";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser("/app");

  let body: {
    audioBase64?: string;
    mimeType?: string;
    durationMs?: number | null;
    language?: string | null;
    prompt?: string | null;
    provider?: "groq" | "elevenlabs";
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  if (!body.audioBase64 || !body.mimeType) {
    return jsonError(400, "audioBase64 and mimeType are required.");
  }

  const result = await transcribeAudioForUser(user.id, {
    audioBase64: body.audioBase64,
    mimeType: body.mimeType,
    durationMs: typeof body.durationMs === "number" ? body.durationMs : null,
    language: body.language ?? null,
    prompt: body.prompt ?? null,
    provider: body.provider
  });

  if (!result.ok) {
    return jsonError(500, result.error);
  }

  if (!result.data.ok) {
    return NextResponse.json(result.data, { status: 200 });
  }

  return NextResponse.json(result.data);
}
