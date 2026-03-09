/**
 * Sprint 45/46: Server-side admin data operations via Convex HTTP client.
 */

import { anyApi, convexQuery, convexMutation } from "../convex/ops";
import type {
  AdminExportJobDetail,
  AdminExportJobsListResponse,
  AdminExportJobsQuery,
  AdminProjectExportHistoryResponse,
} from "../../../../packages/shared/admin/exportMonitoring";

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

// ---------------------------------------------------------------------------
// Sprint 46: Admin lookup — users and projects
// ---------------------------------------------------------------------------

export interface AdminUserSummary {
  id: string;
  displayName: string | null;
  email: string | null;
  accountStatus: string;
  onboardingCompleted: boolean;
  onboardingGoal: string | null;
  projectCount: number;
  lastActivityAt: number | null;
  createdAt: number;
}

export interface AdminUserDetail {
  id: string;
  displayName: string | null;
  email: string | null;
  accountStatus: string;
  onboardingCompleted: boolean;
  onboardingGoal: string | null;
  authProviders: string[];
  emailVerifiedAt: number | null;
  lastActivityAt: number | null;
  createdAt: number;
  updatedAt: number;
  projects: AdminProjectSummary[];
}

export interface AdminProjectSummary {
  id: string;
  title: string;
  status: string;
  bookMode: string;
  templateId: string | null;
  flowStatus: string | null;
  pageCount: number;
  chapterCount: number;
  latestExportStatus: string | null;
  latestExportError: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AdminProjectDetail {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  bookMode: string;
  templateId: string | null;
  flowStatus: string | null;
  photoStatus: string | null;
  orientation: string;
  pageSize: string | null;
  owner: { id: string; displayName: string | null; email: string | null } | null;
  counts: { pages: number; chapters: number; answers: number; frames: number };
  chapterSummaries: {
    id: string;
    title: string;
    chapterKey: string;
    status: string;
    orderIndex: number;
  }[];
  recentExports: {
    id: string;
    type: string;
    status: string;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

export async function searchUsers(
  searchQuery?: string,
  limit?: number
): Promise<{ items: AdminUserSummary[]; total: number }> {
  const result = await convexQuery<{ items: AdminUserSummary[]; total: number }>(
    anyApi.adminLookup.listUsers,
    { searchQuery, limit }
  );
  if (!result.ok) {
    console.error("[admin] searchUsers failed:", result.error);
    return { items: [], total: 0 };
  }
  return result.data;
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const result = await convexQuery<AdminUserDetail | null>(
    anyApi.adminLookup.getUserDetail,
    { userId }
  );
  if (!result.ok) {
    console.error("[admin] getUserDetail failed for userId:", userId, "error:", result.error);
    return null;
  }
  return result.data;
}

export async function getProjectDetail(projectId: string): Promise<AdminProjectDetail | null> {
  const result = await convexQuery<AdminProjectDetail | null>(
    anyApi.adminLookup.getProjectDetail,
    { projectId }
  );
  if (!result.ok) return null;
  return result.data;
}

export async function listAdminExportJobs(
  query: AdminExportJobsQuery,
  options?: { includeOwnerEmail?: boolean; includeFailureSummary?: boolean }
): Promise<AdminExportJobsListResponse> {
  const result = await convexQuery<AdminExportJobsListResponse>(
    anyApi.adminExports.listExportJobs,
    {
      ...query,
      includeOwnerEmail: options?.includeOwnerEmail ?? false,
      includeFailureSummary: options?.includeFailureSummary ?? false,
    }
  );
  if (!result.ok) {
    return {
      items: [],
      pagination: {
        page: Math.max(1, query.page ?? 1),
        pageSize: Math.max(1, query.pageSize ?? 25),
        total: 0,
      },
    };
  }
  return result.data;
}

export async function getAdminExportJobDetail(
  exportId: string,
  options?: { includeOwnerEmail?: boolean; includeFailureSummary?: boolean }
): Promise<AdminExportJobDetail | null> {
  const result = await convexQuery<AdminExportJobDetail | null>(
    anyApi.adminExports.getExportJobDetail,
    {
      exportId,
      includeOwnerEmail: options?.includeOwnerEmail ?? false,
      includeFailureSummary: options?.includeFailureSummary ?? false,
    }
  );
  if (!result.ok) return null;
  return result.data;
}

export async function getAdminProjectExportHistory(
  projectId: string,
  limit?: number,
  options?: { includeOwnerEmail?: boolean; includeFailureSummary?: boolean }
): Promise<AdminProjectExportHistoryResponse | null> {
  const result = await convexQuery<AdminProjectExportHistoryResponse | null>(
    anyApi.adminExports.getProjectExportHistory,
    {
      projectId,
      limit,
      includeOwnerEmail: options?.includeOwnerEmail ?? false,
      includeFailureSummary: options?.includeFailureSummary ?? false,
    }
  );
  if (!result.ok) return null;
  return result.data;
}
