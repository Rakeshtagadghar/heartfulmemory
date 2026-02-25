import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { storageAdapter } from "../../../../lib/storage/storageAdapter";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser("/app");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const input = body as {
    fileName?: string;
    mime?: string;
    sizeBytes?: number;
    width?: number | null;
    height?: number | null;
    storageKey?: string | null;
    url?: string;
  };

  if (!input.fileName || !input.mime || typeof input.sizeBytes !== "number" || !input.url) {
    return jsonError(400, "fileName, mime, sizeBytes, and url are required.");
  }

  try {
    const upload = await storageAdapter.createUploadMetadata(user.id, {
      fileName: input.fileName,
      mime: input.mime,
      sizeBytes: input.sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      storageKey: input.storageKey ?? null,
      url: input.url
    });
    return NextResponse.json({ ok: true, upload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create upload metadata.";
    const status = message.toLowerCase().includes("too large") || message.toLowerCase().includes("only image")
      ? 400
      : 500;
    return jsonError(status, message);
  }
}
