import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Look up an admin user by their app userId (authSubject). */
export const getAdminByUserId = queryGeneric({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("adminUsers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!admin) return null;
    return {
      id: admin._id as string,
      userId: admin.userId,
      role: admin.role,
      status: admin.status,
      createdBy: admin.createdBy ?? null,
      lastLoginAt: admin.lastLoginAt ?? null,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  },
});

/** List all admin users. */
export const listAdminUsers = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("adminUsers").collect();
    return admins.map((a) => ({
      id: a._id as string,
      userId: a.userId,
      role: a.role,
      status: a.status,
      createdBy: a.createdBy ?? null,
      lastLoginAt: a.lastLoginAt ?? null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Record a successful admin login timestamp. */
export const recordAdminLogin = mutationGeneric({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adminUsers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!existing) return { ok: false as const, error: "Admin not found." };
    await ctx.db.patch(existing._id, {
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { ok: true as const };
  },
});

/** Grant admin role to an existing app user. */
export const createAdminUser = mutationGeneric({
  args: {
    userId: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("support_admin"),
      v.literal("content_admin")
    ),
    createdBy: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    // Check if admin already exists
    const existing = await ctx.db
      .query("adminUsers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) {
      return { ok: false as const, error: "User is already an admin." };
    }

    const now = Date.now();
    const id = await ctx.db.insert("adminUsers", {
      userId: args.userId,
      role: args.role,
      status: "active",
      createdBy: args.createdBy ?? null,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true as const, id: id as string };
  },
});

/** Update an admin user's role, status, or both. */
export const updateAdminUser = mutationGeneric({
  args: {
    adminId: v.string(),
    role: v.optional(
      v.union(
        v.literal("super_admin"),
        v.literal("support_admin"),
        v.literal("content_admin")
      )
    ),
    status: v.optional(v.union(v.literal("active"), v.literal("disabled"))),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId as never);
    if (!admin) return { ok: false as const, error: "Admin not found." };

    // Prevent disabling the last active super_admin
    if (args.status === "disabled" && admin.role === "super_admin" && admin.status === "active") {
      const activeSuperAdmins = await ctx.db
        .query("adminUsers")
        .withIndex("by_role", (q) => q.eq("role", "super_admin"))
        .collect();
      const activeCount = activeSuperAdmins.filter((a) => a.status === "active").length;
      if (activeCount <= 1) {
        return { ok: false as const, error: "Cannot disable the last active super admin." };
      }
    }

    // Prevent demoting the last active super_admin
    if (
      args.role &&
      args.role !== "super_admin" &&
      admin.role === "super_admin" &&
      admin.status === "active"
    ) {
      const activeSuperAdmins = await ctx.db
        .query("adminUsers")
        .withIndex("by_role", (q) => q.eq("role", "super_admin"))
        .collect();
      const activeCount = activeSuperAdmins.filter((a) => a.status === "active").length;
      if (activeCount <= 1) {
        return { ok: false as const, error: "Cannot demote the last active super admin." };
      }
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.role) patch.role = args.role;
    if (args.status) patch.status = args.status;

    await ctx.db.patch(admin._id, patch);
    return { ok: true as const };
  },
});

/** Bootstrap: create first super admin (only if no admins exist). */
export const bootstrapSuperAdmin = mutationGeneric({
  args: {
    userId: v.string(),
    bootstrapSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any admin already exists
    const anyAdmin = await ctx.db.query("adminUsers").first();
    if (anyAdmin) {
      return { ok: false as const, error: "Admin users already exist. Bootstrap is disabled." };
    }

    const now = Date.now();
    const id = await ctx.db.insert("adminUsers", {
      userId: args.userId,
      role: "super_admin",
      status: "active",
      createdBy: null,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true as const, id: id as string };
  },
});
