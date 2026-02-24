import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = MutationCtx | QueryCtx;

export type StorybookRole = "OWNER" | "EDITOR" | "VIEWER";

type IdentityLike = {
  subject?: string | null;
  tokenIdentifier?: string | null;
};

type StorybookDocLike = {
  _id: unknown;
  ownerId: string;
};

const roleRank: Record<StorybookRole, number> = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1
};

export function roleSatisfies(role: StorybookRole, minRole: StorybookRole) {
  return roleRank[role] >= roleRank[minRole];
}

export function getIdentitySubject(identity: IdentityLike | null | undefined) {
  return identity?.subject || identity?.tokenIdentifier || null;
}

export async function findUserDocBySubject(ctx: Ctx, subject: string) {
  return ctx.db
    .query("users")
    .withIndex("by_auth_subject", (q) => q.eq("authSubject", subject))
    .unique();
}

export async function requireUser(ctx: Ctx, explicitSubject?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = getIdentitySubject(identity) || explicitSubject || null;
  if (!subject) {
    throw new Error("Unauthorized");
  }

  const userDoc = await findUserDocBySubject(ctx, subject);
  return { subject, userDoc };
}

export function requireOwner(
  viewer: { subject?: string | null; tokenIdentifier?: string | null },
  ownerOrDoc: string | { ownerId?: string | null; authSubject?: string | null } | null | undefined
) {
  const viewerSubject = viewer.subject || viewer.tokenIdentifier;
  const ownerId =
    typeof ownerOrDoc === "string"
      ? ownerOrDoc
      : (ownerOrDoc?.ownerId || ownerOrDoc?.authSubject || null);

  if (!viewerSubject || !ownerId || viewerSubject !== ownerId) {
    throw new Error("Forbidden");
  }
}

async function findAcceptedCollaboratorByUserId(
  ctx: Ctx,
  storybookId: unknown,
  userId: string
) {
  const rows = await ctx.db
    .query("collaborators")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  return (
    rows.find(
      (row) =>
        String(row.storybookId) === String(storybookId) &&
        row.status === "ACCEPTED" &&
        (row.role === "OWNER" || row.role === "EDITOR" || row.role === "VIEWER")
    ) || null
  );
}

export async function canAccessStorybook(
  ctx: Ctx,
  storybookId: unknown,
  minRole: StorybookRole = "VIEWER",
  explicitSubject?: string
) {
  try {
    const access = await assertCanAccessStorybook(ctx, storybookId, minRole, explicitSubject);
    return Boolean(access.storybook && access.viewer.subject);
  } catch {
    return false;
  }
}

export async function assertCanAccessStorybook(
  ctx: Ctx,
  storybookId: unknown,
  minRole: StorybookRole = "VIEWER",
  explicitSubject?: string
) {
  const viewer = await requireUser(ctx, explicitSubject);
  const storybook = (await ctx.db.get(storybookId as never)) as StorybookDocLike | null;
  if (!storybook) {
    throw new Error("Not found");
  }

  if (storybook.ownerId === viewer.subject) {
    if (!roleSatisfies("OWNER", minRole)) throw new Error("Forbidden");
    return { viewer, storybook, role: "OWNER" as const };
  }

  const collaborator = await findAcceptedCollaboratorByUserId(ctx, storybook._id, viewer.subject);
  if (!collaborator) {
    throw new Error("Forbidden");
  }

  const role = collaborator.role as StorybookRole;
  if (!roleSatisfies(role, minRole)) {
    throw new Error("Forbidden");
  }

  return { viewer, storybook, role };
}
