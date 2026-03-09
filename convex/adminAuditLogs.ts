import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

/** Write an admin audit log entry. */
export const writeAuditLog = mutationGeneric({
  args: {
    adminUserId: v.optional(v.union(v.string(), v.null())),
    actorUserId: v.optional(v.union(v.string(), v.null())),
    eventType: v.string(),
    resourceType: v.optional(v.union(v.string(), v.null())),
    resourceId: v.optional(v.union(v.string(), v.null())),
    action: v.string(),
    metadataJson: v.optional(v.union(v.any(), v.null())),
    ipAddress: v.optional(v.union(v.string(), v.null())),
    userAgent: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("adminAuditLogs", {
      adminUserId: args.adminUserId ?? null,
      actorUserId: args.actorUserId ?? null,
      eventType: args.eventType,
      resourceType: args.resourceType ?? null,
      resourceId: args.resourceId ?? null,
      action: args.action,
      metadataJson: args.metadataJson ?? null,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});

/** List recent audit logs (newest first), with optional event type filter. */
export const listAuditLogs = queryGeneric({
  args: {
    eventType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    let query;
    if (args.eventType) {
      query = ctx.db
        .query("adminAuditLogs")
        .withIndex("by_eventType", (q) => q.eq("eventType", args.eventType!));
    } else {
      query = ctx.db.query("adminAuditLogs").withIndex("by_createdAt");
    }

    const logs = await query.order("desc").take(limit);

    return logs.map((l) => ({
      id: l._id as string,
      adminUserId: l.adminUserId ?? null,
      actorUserId: l.actorUserId ?? null,
      eventType: l.eventType,
      resourceType: l.resourceType ?? null,
      resourceId: l.resourceId ?? null,
      action: l.action,
      metadataJson: l.metadataJson ?? null,
      ipAddress: l.ipAddress ?? null,
      userAgent: l.userAgent ?? null,
      createdAt: l.createdAt,
    }));
  },
});

export const listLogsForResource = queryGeneric({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(50, Math.floor(args.limit ?? 10)));
    const logs = await ctx.db.query("adminAuditLogs").withIndex("by_createdAt").order("desc").take(200);

    return logs
      .filter(
        (log) => log.resourceType === args.resourceType && log.resourceId === args.resourceId
      )
      .slice(0, limit)
      .map((l) => ({
        id: l._id as string,
        adminUserId: l.adminUserId ?? null,
        actorUserId: l.actorUserId ?? null,
        eventType: l.eventType,
        resourceType: l.resourceType ?? null,
        resourceId: l.resourceId ?? null,
        action: l.action,
        metadataJson: l.metadataJson ?? null,
        ipAddress: l.ipAddress ?? null,
        userAgent: l.userAgent ?? null,
        createdAt: l.createdAt,
      }));
  },
});
