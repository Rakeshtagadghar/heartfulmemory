/**
 * Sprint 45: Admin RBAC — roles, permissions, and helpers.
 *
 * Single source of truth for admin role definitions and permission mapping.
 * All permission checks should flow through this module.
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const ADMIN_ROLES = ["super_admin", "support_admin", "content_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isValidAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export const ADMIN_PERMISSIONS = [
  "dashboard.view",
  "users.view",
  "users.manage_admin_roles",
  "projects.view",
  "exports.view",
  "exports.retry",
  "billing.view",
  "templates.view",
  "templates.manage",
  "content.moderate",
  "support.view",
  "feature_flags.view",
  "feature_flags.manage",
  "audit_logs.view",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

// ---------------------------------------------------------------------------
// Role → Permission map
// ---------------------------------------------------------------------------

export const ROLE_PERMISSION_MAP: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: [
    "dashboard.view",
    "users.view",
    "users.manage_admin_roles",
    "projects.view",
    "exports.view",
    "exports.retry",
    "billing.view",
    "templates.view",
    "templates.manage",
    "content.moderate",
    "support.view",
    "feature_flags.view",
    "feature_flags.manage",
    "audit_logs.view",
  ],
  support_admin: [
    "dashboard.view",
    "users.view",
    "projects.view",
    "exports.view",
    "exports.retry",
    "support.view",
  ],
  content_admin: [
    "dashboard.view",
    "projects.view",
    "exports.view",
    "templates.view",
    "templates.manage",
    "content.moderate",
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the set of permissions for a given role, or empty array for unknown roles. */
export function getPermissionsForRole(role: string): readonly AdminPermission[] {
  if (!isValidAdminRole(role)) return [];
  return ROLE_PERMISSION_MAP[role];
}

/** Check whether a role grants a specific permission. */
export function hasPermission(role: string, permission: AdminPermission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/**
 * Assert that a role has a specific permission.
 * Throws if the role lacks the permission.
 */
export function requirePermission(role: string, permission: AdminPermission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: missing permission "${permission}"`);
  }
}

// ---------------------------------------------------------------------------
// Admin status
// ---------------------------------------------------------------------------

export type AdminStatus = "active" | "disabled";

export function isAdminActive(status: string | null | undefined): boolean {
  return status === "active";
}

// ---------------------------------------------------------------------------
// Audit event types
// ---------------------------------------------------------------------------

export const ADMIN_AUDIT_EVENTS = [
  "admin_login_success",
  "admin_login_denied",
  "admin_logout",
  "admin_role_granted",
  "admin_role_changed",
  "admin_role_disabled",
  "admin_role_reactivated",
  "admin_page_viewed",
  "admin_api_forbidden",
  "admin_export_list_viewed",
  "admin_export_viewed",
  "admin_project_exports_viewed",
  "admin_export_retry_requested",
  "admin_export_retry_blocked",
  "admin_export_retry_queued",
  "admin_export_retry_failed",
] as const;

export type AdminAuditEventType = (typeof ADMIN_AUDIT_EVENTS)[number];

// ---------------------------------------------------------------------------
// Navigation items (role-aware)
// ---------------------------------------------------------------------------

export interface AdminNavItem {
  label: string;
  href: string;
  permission: AdminPermission;
  icon?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", permission: "dashboard.view" },
  { label: "Users", href: "/admin/users", permission: "users.view" },
  { label: "Exports", href: "/admin/exports", permission: "exports.view" },
  { label: "Admin Users", href: "/admin/admin-users", permission: "users.manage_admin_roles" },
  { label: "Audit Logs", href: "/admin/audit-logs", permission: "audit_logs.view" },
];

export function getNavItemsForRole(role: string): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => hasPermission(role, item.permission));
}
