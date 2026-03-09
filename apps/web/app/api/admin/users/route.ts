import { NextResponse } from "next/server";
import { requireAdminPermissionForApi } from "../../../../lib/admin/requireAdmin";
import { searchUsers, writeAuditLog } from "../../../../lib/admin/adminOps";

const FORBIDDEN = NextResponse.json(
  { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." } },
  { status: 403 }
);

/** GET /api/admin/users — search and list users */
export async function GET(request: Request) {
  const ctx = await requireAdminPermissionForApi("users.view");
  if (!ctx) return FORBIDDEN;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("pageSize") ?? 50), 200);

  const result = await searchUsers(q, limit);

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_user_search",
    action: "view",
    metadataJson: { query: q ? `${q.slice(0, 3)}***` : null, resultCount: result.total },
  });

  return NextResponse.json({ success: true, data: result });
}
