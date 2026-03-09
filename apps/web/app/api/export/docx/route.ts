import { NextRequest } from "next/server";
import { requireExportAccess } from "../../../../lib/export/authz";
import { checkExportRateLimit } from "../../../../lib/export/rateLimit";
import { runDocxExport } from "../../../../lib/export/runDocxExport";

export async function POST(request: NextRequest) {
  let viewer;
  try {
    viewer = await requireExportAccess("");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { storybookId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const storybookId = body.storybookId;
  if (!storybookId) {
    return Response.json({ error: "storybookId required" }, { status: 400 });
  }

  const rateLimitResult = checkExportRateLimit(viewer.id);
  if (!rateLimitResult.ok) {
    return Response.json(
      { error: "Export rate limit exceeded. Please wait a moment.", code: "RATE_LIMIT" },
      { status: 429 }
    );
  }

  const result = await runDocxExport({
    viewerSubject: viewer.id,
    storybookId,
    triggerSource: "user",
    requestedByUserId: viewer.id,
  });
  return result.response;
}
