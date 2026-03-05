import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/auth/server";
import { signR2GetObject } from "../../../../../lib/r2/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await params;

  try {
    await requireAuthenticatedUser("/app");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // We need to look up the artifact by ID. Since we don't have a direct getById query,
  // we'll use the job query to verify ownership, then sign the R2 key.
  // For now, we redirect to a signed URL.
  // The artifactId is used to look up the r2Key from the exportArtifacts table.

  try {
    const signedUrl = await signR2GetObject({
      key: `exports/${artifactId}`, // This would need proper lookup
      expiresInSeconds: 300,
    });
    return NextResponse.redirect(signedUrl);
  } catch {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }
}
