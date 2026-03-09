/**
 * Sprint 45: Server-side admin data operations via Convex HTTP client.
 */

import { anyApi, convexQuery, convexMutation } from "../convex/ops";

// ---------------------------------------------------------------------------
// Admin user queries
// ---------------------------------------------------------------------------

export interface AdminUserRecord {
  id: string;
  userId: string;
  role: string;
  status: string;
  createdBy: string | null;
  lastLoginAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export async function getAdminUserByUserId(
  userId: string
): Promise<AdminUserRecord | null> {
  const result = await convexQuery<AdminUserRecord | null>(
    anyApi.adminUsers.getAdminByUserId,
    { userId }
  );
  if (!result.ok) return null;
  return result.data;
}

export async function listAllAdminUsers(): Promise<AdminUserRecord[]> {
  const result = await convexQuery<AdminUserRecord[]>(
    anyApi.adminUsers.listAdminUsers
  );
  if (!result.ok) return [];
  return result.data;
}

// ---------------------------------------------------------------------------
// Admin user mutations
// ---------------------------------------------------------------------------

export async function recordAdminLogin(userId: string) {
  return convexMutation(anyApi.adminUsers.recordAdminLogin, { userId });
}

export async function createAdminUser(
  userId: string,
  role: string,
  createdBy: string | null
) {
  return convexMutation<{ ok: boolean; id?: string; error?: string }>(
    anyApi.adminUsers.createAdminUser,
    { userId, role, createdBy }
  );
}

export async function updateAdminUser(
  adminId: string,
  patch: { role?: string; status?: string }
) {
  return convexMutation<{ ok: boolean; error?: string }>(
    anyApi.adminUsers.updateAdminUser,
    { adminId, ...patch }
  );
}

export async function bootstrapSuperAdmin(
  userId: string,
  bootstrapSecret: string
) {
  return convexMutation<{ ok: boolean; id?: string; error?: string }>(
    anyApi.adminUsers.bootstrapSuperAdmin,
    { userId, bootstrapSecret }
  );
}

// ---------------------------------------------------------------------------
// Audit log operations
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  adminUserId: string | null;
  actorUserId: string | null;
  eventType: string;
  resourceType: string | null;
  resourceId: string | null;
  action: string;
  metadataJson: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: number;
}

export async function writeAuditLog(entry: {
  adminUserId?: string | null;
  actorUserId?: string | null;
  eventType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  action: string;
  metadataJson?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  return convexMutation(anyApi.adminAuditLogs.writeAuditLog, entry);
}

export async function listAuditLogs(opts?: {
  eventType?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const result = await convexQuery<AuditLogEntry[]>(
    anyApi.adminAuditLogs.listAuditLogs,
    opts ?? {}
  );
  if (!result.ok) return [];
  return result.data;
}
