import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../lib/auth/server";
import { bootstrapSuperAdmin, writeAuditLog } from "../../../../lib/admin/adminOps";

/**
 * POST /api/admin/bootstrap
 *
 * One-time bootstrap to create the first super admin.
 * Requires:
 *   - Authenticated user session
 *   - ADMIN_BOOTSTRAP_SECRET env var set and matching request body
 *   - No existing admin users in the database
 */
export async function POST(request: Request) {
  const session = await getAuthSession();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in first." } },
      { status: 401 }
    );
  }

  const envSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!envSecret) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_AVAILABLE", message: "Bootstrap is not configured." } },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { secret } = body as { secret?: string };

  if (!secret || secret !== envSecret) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Invalid bootstrap secret." } },
      { status: 403 }
    );
  }

  const result = await bootstrapSuperAdmin(user.id, secret);

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: "CONFLICT", message: result.data?.error ?? result.error ?? "Bootstrap failed." } },
      { status: 409 }
    );
  }

  void writeAuditLog({
    adminUserId: result.data?.id ?? null,
    actorUserId: user.id,
    eventType: "admin_role_granted",
    resourceType: "admin_user",
    resourceId: user.id,
    action: "update_role",
    metadataJson: { method: "bootstrap", role: "super_admin" },
  });

  return NextResponse.json({
    success: true,
    data: { id: result.data?.id, role: "super_admin" },
  }, { status: 201 });
}
