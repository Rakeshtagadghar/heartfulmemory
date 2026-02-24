import type { MutationCtx, QueryCtx } from "convex/server";

export async function requireUser(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity;
}

export function requireOwner<T extends { ownerId?: string; authSubject?: string }>(
  viewer: { subject?: string; tokenIdentifier?: string },
  doc: T | null | undefined
) {
  if (!doc) throw new Error("Not found");
  const viewerSubject = viewer.subject || viewer.tokenIdentifier;
  const docOwner = doc.ownerId || doc.authSubject;
  if (!viewerSubject || !docOwner || viewerSubject !== docOwner) {
    throw new Error("Forbidden");
  }
  return doc;
}
