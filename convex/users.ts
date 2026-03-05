import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

type AuthProvider = "google" | "password" | "otp" | "magic_link";

type ProviderFlags = {
  google: boolean;
  password: boolean;
  otp: boolean;
  magic_link: boolean;
};

const EMPTY_PROVIDER_FLAGS: ProviderFlags = {
  google: false,
  password: false,
  otp: false,
  magic_link: false
};

function deriveHasPassword(input: {
  hasPassword?: boolean | null;
  passwordHash?: string | null;
  authProvidersLinked?: unknown;
}) {
  if (typeof input.hasPassword === "boolean") return input.hasPassword;
  if (typeof input.passwordHash === "string" && input.passwordHash.length > 0) return true;
  const providers = normalizeProviderFlags(input.authProvidersLinked);
  return providers.password;
}

function normalizeProviderFlags(value: unknown): ProviderFlags {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_PROVIDER_FLAGS;
  const source = value as Record<string, unknown>;
  return {
    google: Boolean(source.google),
    password: Boolean(source.password),
    otp: Boolean(source.otp),
    magic_link: Boolean(source.magic_link)
  };
}

function withLinkedProvider(existing: unknown, provider?: AuthProvider | null) {
  const current = normalizeProviderFlags(existing);
  if (!provider) return current;
  return {
    ...current,
    [provider]: true
  };
}

function toProfileRecord(userId: string, user: {
  display_name?: string;
  email?: string;
  primaryEmail?: string;
  passwordHash?: string;
  hasPassword?: boolean;
  emailVerifiedAt?: number | null;
  authProvidersLinked?: ProviderFlags;
  deletionStatus?: "active" | "pending_deletion" | "deleted";
  deletionRequestedAt?: number | null;
  purgeAt?: number | null;
  lastActivityAt?: number | null;
  onboarding_completed: boolean;
  onboarding_goal?: string;
  marketing_consent?: boolean;
  locale?: string;
  timezone?: string;
  createdAt: number;
}) {
  return {
    id: userId,
    display_name: user.display_name ?? null,
    email: user.email ?? null,
    has_password: deriveHasPassword(user),
    primary_email: user.primaryEmail ?? user.email ?? null,
    email_verified_at:
      typeof user.emailVerifiedAt === "number" ? new Date(user.emailVerifiedAt).toISOString() : null,
    auth_providers_linked: normalizeProviderFlags(user.authProvidersLinked),
    deletion_status: user.deletionStatus ?? "active",
    deletion_requested_at:
      typeof user.deletionRequestedAt === "number"
        ? new Date(user.deletionRequestedAt).toISOString()
        : null,
    purge_at: typeof user.purgeAt === "number" ? new Date(user.purgeAt).toISOString() : null,
    last_activity_at:
      typeof user.lastActivityAt === "number" ? new Date(user.lastActivityAt).toISOString() : null,
    onboarding_completed: user.onboarding_completed,
    onboarding_goal: user.onboarding_goal ?? null,
    marketing_consent: user.marketing_consent ?? null,
    locale: user.locale ?? null,
    timezone: user.timezone ?? null,
    created_at: new Date(user.createdAt).toISOString()
  };
}

export const getCurrentUser = queryGeneric({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();
    if (!user) return null;
    return toProfileRecord(args.userId, user);
  }
});

export const getUserByEmail = queryGeneric({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const userByPrimary = await ctx.db
      .query("users")
      .withIndex("by_primary_email", (q) => q.eq("primaryEmail", normalizedEmail))
      .unique();

    const user =
      userByPrimary ||
      (await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .unique());

    if (!user) return null;

    return {
      userId: user.authSubject,
      email: user.primaryEmail ?? user.email ?? null,
      displayName: user.display_name ?? null,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      authProvidersLinked: normalizeProviderFlags(user.authProvidersLinked),
      hasPassword: deriveHasPassword(user)
    };
  }
});

export const getUserByEmailForAuth = queryGeneric({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const userByPrimary = await ctx.db
      .query("users")
      .withIndex("by_primary_email", (q) => q.eq("primaryEmail", normalizedEmail))
      .unique();

    const user =
      userByPrimary ||
      (await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .unique());

    if (!user) return null;

    return {
      userId: user.authSubject,
      email: user.primaryEmail ?? user.email ?? null,
      displayName: user.display_name ?? null,
      passwordHash: user.passwordHash ?? null,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      hasPassword: deriveHasPassword(user)
    };
  }
});

export const upsertCurrentUser = mutationGeneric({
  args: {
    userId: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    displayName: v.optional(v.union(v.string(), v.null())),
    locale: v.optional(v.union(v.string(), v.null())),
    timezone: v.optional(v.union(v.string(), v.null())),
    authProvider: v.optional(
      v.union(v.literal("google"), v.literal("password"), v.literal("otp"), v.literal("magic_link"))
    ),
    emailVerified: v.optional(v.boolean()),
    hasPassword: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();

    if (existing) {
      const linkedProviders = withLinkedProvider(existing.authProvidersLinked, args.authProvider);
      const nextHasPassword =
        deriveHasPassword(existing) ||
        Boolean(args.hasPassword) ||
        linkedProviders.password ||
        args.authProvider === "password";
      const shouldSetVerifiedAt =
        Boolean(args.emailVerified) && typeof existing.emailVerifiedAt !== "number";
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        primaryEmail: args.email ?? existing.primaryEmail ?? existing.email,
        display_name: args.displayName ?? existing.display_name,
        authProvidersLinked: linkedProviders,
        hasPassword: nextHasPassword,
        emailVerifiedAt: shouldSetVerifiedAt ? now : existing.emailVerifiedAt ?? null,
        deletionStatus: existing.deletionStatus ?? "active",
        deletionRequestedAt: existing.deletionRequestedAt ?? null,
        purgeAt: existing.purgeAt ?? null,
        lastActivityAt: now,
        locale: args.locale ?? existing.locale,
        timezone: args.timezone ?? existing.timezone,
        updatedAt: now
      });
    } else {
      const linkedProviders = withLinkedProvider(null, args.authProvider);
      const nextHasPassword =
        Boolean(args.hasPassword) || linkedProviders.password || args.authProvider === "password";
      await ctx.db.insert("users", {
        authSubject: args.userId,
        email: args.email ?? undefined,
        primaryEmail: args.email ?? undefined,
        hasPassword: nextHasPassword,
        emailVerifiedAt: args.emailVerified ? now : null,
        authProvidersLinked: linkedProviders,
        deletionStatus: "active",
        deletionRequestedAt: null,
        purgeAt: null,
        lastActivityAt: now,
        display_name: args.displayName ?? undefined,
        onboarding_completed: false,
        locale: args.locale ?? undefined,
        timezone: args.timezone ?? undefined,
        createdAt: now,
        updatedAt: now
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();
    if (!user) throw new Error("Failed to upsert user.");

    return toProfileRecord(args.userId, user);
  }
});

export const completeOnboarding = mutationGeneric({
  args: {
    userId: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    displayName: v.string(),
    goal: v.string(),
    marketingConsent: v.boolean(),
    timezone: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        primaryEmail: args.email ?? existing.primaryEmail ?? existing.email,
        display_name: args.displayName,
        onboarding_goal: args.goal,
        marketing_consent: args.marketingConsent,
        onboarding_completed: true,
        deletionStatus: existing.deletionStatus ?? "active",
        deletionRequestedAt: existing.deletionRequestedAt ?? null,
        purgeAt: existing.purgeAt ?? null,
        lastActivityAt: now,
        timezone: args.timezone ?? existing.timezone,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("users", {
        authSubject: args.userId,
        email: args.email ?? undefined,
        primaryEmail: args.email ?? undefined,
        emailVerifiedAt: null,
        authProvidersLinked: EMPTY_PROVIDER_FLAGS,
        deletionStatus: "active",
        deletionRequestedAt: null,
        purgeAt: null,
        lastActivityAt: now,
        display_name: args.displayName,
        onboarding_goal: args.goal,
        marketing_consent: args.marketingConsent,
        onboarding_completed: true,
        timezone: args.timezone ?? undefined,
        createdAt: now,
        updatedAt: now
      });
    }

    return { ok: true };
  }
});

export const markEmailVerified = mutationGeneric({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();
    if (!existing) return { ok: false as const, error: "User not found." };

    await ctx.db.patch(existing._id, {
      emailVerifiedAt: now,
      hasPassword: deriveHasPassword(existing),
      lastActivityAt: now,
      updatedAt: now
    });

    return { ok: true as const };
  }
});

export const markEmailVerifiedByEmail = mutationGeneric({
  args: {
    email: v.string()
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const now = Date.now();
    const existing =
      (await ctx.db
        .query("users")
        .withIndex("by_primary_email", (q) => q.eq("primaryEmail", normalizedEmail))
        .unique()) ||
      (await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .unique());

    if (!existing) {
      return { ok: false as const, error: "User not found." };
    }

    await ctx.db.patch(existing._id, {
      emailVerifiedAt: now,
      hasPassword: deriveHasPassword(existing),
      lastActivityAt: now,
      updatedAt: now
    });

    return { ok: true as const, userId: existing.authSubject };
  }
});

export const setPasswordHashByEmail = mutationGeneric({
  args: {
    email: v.string(),
    passwordHash: v.string()
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const now = Date.now();
    const existing =
      (await ctx.db
        .query("users")
        .withIndex("by_primary_email", (q) => q.eq("primaryEmail", normalizedEmail))
        .unique()) ||
      (await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .unique());

    if (!existing) {
      return { ok: false as const, error: "User not found." };
    }

    await ctx.db.patch(existing._id, {
      passwordHash: args.passwordHash,
      hasPassword: true,
      authProvidersLinked: withLinkedProvider(existing.authProvidersLinked, "password"),
      lastActivityAt: now,
      updatedAt: now
    });

    return { ok: true as const, userId: existing.authSubject };
  }
});

export const setPasswordHashByUserId = mutationGeneric({
  args: {
    userId: v.string(),
    passwordHash: v.string(),
    allowIfAlreadySet: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();

    if (!existing) {
      return { ok: false as const, code: "user_not_found" as const };
    }

    const currentHasPassword = deriveHasPassword(existing);
    if (currentHasPassword && !args.allowIfAlreadySet) {
      return { ok: false as const, code: "already_has_password" as const };
    }

    await ctx.db.patch(existing._id, {
      passwordHash: args.passwordHash,
      hasPassword: true,
      authProvidersLinked: withLinkedProvider(existing.authProvidersLinked, "password"),
      lastActivityAt: now,
      updatedAt: now
    });

    return {
      ok: true as const,
      userId: existing.authSubject,
      email: existing.primaryEmail ?? existing.email ?? null,
      displayName: existing.display_name ?? null
    };
  }
});

export const getPasswordStateByUserId = queryGeneric({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();
    if (!user) return null;

    return {
      userId: user.authSubject,
      email: user.primaryEmail ?? user.email ?? null,
      displayName: user.display_name ?? null,
      hasPassword: deriveHasPassword(user),
      authProvidersLinked: normalizeProviderFlags(user.authProvidersLinked)
    };
  }
});

export const linkAuthProvider = mutationGeneric({
  args: {
    userId: v.string(),
    provider: v.union(v.literal("google"), v.literal("password"), v.literal("otp"), v.literal("magic_link"))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();
    if (!existing) return { ok: false as const, error: "User not found." };

    await ctx.db.patch(existing._id, {
      authProvidersLinked: withLinkedProvider(existing.authProvidersLinked, args.provider),
      hasPassword: deriveHasPassword(existing) || args.provider === "password",
      lastActivityAt: now,
      updatedAt: now
    });

    return { ok: true as const };
  }
});
