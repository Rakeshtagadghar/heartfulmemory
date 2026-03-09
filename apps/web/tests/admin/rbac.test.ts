import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  ADMIN_PERMISSIONS,
  ROLE_PERMISSION_MAP,
  isValidAdminRole,
  getPermissionsForRole,
  hasPermission,
  requirePermission,
  isAdminActive,
  getNavItemsForRole,
} from "../../../../packages/shared/admin/rbac";

describe("isValidAdminRole", () => {
  it("returns true for all defined roles", () => {
    for (const role of ADMIN_ROLES) {
      expect(isValidAdminRole(role)).toBe(true);
    }
  });

  it("returns false for unknown roles", () => {
    expect(isValidAdminRole("viewer")).toBe(false);
    expect(isValidAdminRole("")).toBe(false);
    expect(isValidAdminRole(null)).toBe(false);
    expect(isValidAdminRole(undefined)).toBe(false);
    expect(isValidAdminRole(42)).toBe(false);
  });
});

describe("getPermissionsForRole", () => {
  it("returns permissions for each valid role", () => {
    for (const role of ADMIN_ROLES) {
      const perms = getPermissionsForRole(role);
      expect(perms.length).toBeGreaterThan(0);
      expect(perms).toEqual(ROLE_PERMISSION_MAP[role]);
    }
  });

  it("returns empty array for unknown roles", () => {
    expect(getPermissionsForRole("hacker")).toEqual([]);
    expect(getPermissionsForRole("")).toEqual([]);
  });
});

describe("hasPermission", () => {
  it("super_admin has all permissions", () => {
    for (const perm of ADMIN_PERMISSIONS) {
      expect(hasPermission("super_admin", perm)).toBe(true);
    }
  });

  it("support_admin has dashboard.view but not users.manage_admin_roles", () => {
    expect(hasPermission("support_admin", "dashboard.view")).toBe(true);
    expect(hasPermission("support_admin", "users.manage_admin_roles")).toBe(false);
  });

  it("content_admin has templates.manage but not billing.view", () => {
    expect(hasPermission("content_admin", "templates.manage")).toBe(true);
    expect(hasPermission("content_admin", "billing.view")).toBe(false);
    expect(hasPermission("content_admin", "exports.view")).toBe(true);
    expect(hasPermission("content_admin", "support.view")).toBe(false);
  });

  it("unknown role has no permissions (deny by default)", () => {
    expect(hasPermission("unknown_role", "dashboard.view")).toBe(false);
    expect(hasPermission("", "dashboard.view")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("does not throw when role has the permission", () => {
    expect(() => requirePermission("super_admin", "dashboard.view")).not.toThrow();
  });

  it("throws when role lacks the permission", () => {
    expect(() => requirePermission("content_admin", "billing.view")).toThrow("Forbidden");
  });

  it("throws for unknown roles", () => {
    expect(() => requirePermission("fake", "dashboard.view")).toThrow("Forbidden");
  });
});

describe("isAdminActive", () => {
  it("returns true for 'active'", () => {
    expect(isAdminActive("active")).toBe(true);
  });

  it("returns false for 'disabled'", () => {
    expect(isAdminActive("disabled")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isAdminActive(null)).toBe(false);
    expect(isAdminActive(undefined)).toBe(false);
  });
});

describe("getNavItemsForRole", () => {
  it("super_admin sees all nav items", () => {
    const items = getNavItemsForRole("super_admin");
    expect(items.length).toBe(5);
    const labels = items.map((i) => i.label);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Users");
    expect(labels).toContain("Exports");
    expect(labels).toContain("Admin Users");
    expect(labels).toContain("Audit Logs");
  });

  it("support_admin sees Dashboard, Users, and Exports", () => {
    const items = getNavItemsForRole("support_admin");
    const labels = items.map((i) => i.label);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Users");
    expect(labels).toContain("Exports");
    expect(labels).not.toContain("Admin Users");
    expect(labels).not.toContain("Audit Logs");
  });

  it("content_admin sees Dashboard and Exports", () => {
    const items = getNavItemsForRole("content_admin");
    const labels = items.map((i) => i.label);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Exports");
    expect(labels).toHaveLength(2);
  });

  it("unknown role gets no nav items", () => {
    expect(getNavItemsForRole("nobody")).toEqual([]);
  });
});

describe("role-permission matrix integrity", () => {
  it("every role maps to valid permission strings", () => {
    for (const role of ADMIN_ROLES) {
      const perms = ROLE_PERMISSION_MAP[role];
      for (const p of perms) {
        expect((ADMIN_PERMISSIONS as readonly string[]).includes(p)).toBe(true);
      }
    }
  });

  it("super_admin has every defined permission", () => {
    const superPerms = ROLE_PERMISSION_MAP.super_admin;
    for (const perm of ADMIN_PERMISSIONS) {
      expect(superPerms).toContain(perm);
    }
  });

  it("support_admin is a subset of super_admin", () => {
    const superPerms = new Set(ROLE_PERMISSION_MAP.super_admin);
    for (const p of ROLE_PERMISSION_MAP.support_admin) {
      expect(superPerms.has(p)).toBe(true);
    }
  });

  it("content_admin is a subset of super_admin", () => {
    const superPerms = new Set(ROLE_PERMISSION_MAP.super_admin);
    for (const p of ROLE_PERMISSION_MAP.content_admin) {
      expect(superPerms.has(p)).toBe(true);
    }
  });
});
