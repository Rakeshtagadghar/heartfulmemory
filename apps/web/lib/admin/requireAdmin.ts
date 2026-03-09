/**
 * Sprint 45: Server-side admin authentication and authorization guard.
 *
 * All admin route and API protection flows through this module.
 */

import { redirect } from "next/navigation";
import { requireAuthenticatedUser, getAuthSession } from "../auth/server";
import { getAdminUserByUserId } from "./adminOps";
import type { AdminPermission } from "../../../../packages/shared/admin/rbac";
import { hasPermission, isAdminActive, getPermissionsForRole } from "../../../../packages/shared/admin/rbac";

export interface AdminContext {
  userId: string;
  email: string;
  adminId: string;
  role: string;
  permissions: readonly AdminPermission[];
}

/**
 * Require the current user to be an active admin.
 * Redirects to sign-in if unauthenticated, or /admin/forbidden if not admin.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const user = await requireAuthenticatedUser("/admin");

  const admin = await getAdminUserByUserId(user.id);

  if (!admin || !isAdminActive(admin.status)) {
    redirect("/admin/forbidden");
  }

  const permissions = getPermissionsForRole(admin.role);

  return {
    userId: user.id,
    email: user.email ?? "",
    adminId: admin.id,
    role: admin.role,
    permissions,
  };
}

/**
 * Require the current user to be an active admin with a specific permission.
 * Returns AdminContext on success, redirects on failure.
 */
export async function requireAdminWithPermission(
  permission: AdminPermission
): Promise<AdminContext> {
  const ctx = await requireAdmin();

  if (!hasPermission(ctx.role, permission)) {
    redirect("/admin/forbidden");
  }

  return ctx;
}

/**
 * API guard: returns AdminContext or null (for JSON responses, not redirects).
 */
export async function getAdminContextForApi(): Promise<AdminContext | null> {
  try {
    const session = await getAuthSession();
    const user = session?.user;
    if (!user?.id) return null;

    const admin = await getAdminUserByUserId(user.id);
    if (!admin || !isAdminActive(admin.status)) return null;

    const permissions = getPermissionsForRole(admin.role);

    return {
      userId: user.id,
      email: user.email ?? "",
      adminId: admin.id,
      role: admin.role,
      permissions,
    };
  } catch {
    return null;
  }
}

/**
 * API guard: requires admin + specific permission. Returns context or null.
 */
export async function requireAdminPermissionForApi(
  permission: AdminPermission
): Promise<AdminContext | null> {
  const ctx = await getAdminContextForApi();
  if (!ctx) return null;
  if (!hasPermission(ctx.role, permission)) return null;
  return ctx;
}
