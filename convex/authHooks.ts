import { mutationGeneric } from "convex/server";
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

function withProvider(existing: unknown, provider?: AuthProvider | null): ProviderFlags {
  const current = normalizeProviderFlags(existing);
  if (!provider) return current;
  return {
    ...current,
    [provider]: true
  };
}

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

export const syncPostLogin = mutationGeneric({
  args: {
    userId: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    displayName: v.optional(v.union(v.string(), v.null())),
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
      const linkedProviders = withProvider(existing.authProvidersLinked, args.authProvider);
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
        hasPassword: nextHasPassword,
        authProvidersLinked: linkedProviders,
        emailVerifiedAt: shouldSetVerifiedAt ? now : existing.emailVerifiedAt ?? null,
        lastActivityAt: now,
        updatedAt: now
      });

      return { ok: true as const, hasPassword: nextHasPassword };
    }

    const linkedProviders = withProvider(null, args.authProvider);
    const nextHasPassword =
      Boolean(args.hasPassword) || linkedProviders.password || args.authProvider === "password";
    await ctx.db.insert("users", {
      authSubject: args.userId,
      email: args.email ?? undefined,
      primaryEmail: args.email ?? undefined,
      hasPassword: nextHasPassword,
      passwordHash: undefined,
      emailVerifiedAt: args.emailVerified ? now : null,
      authProvidersLinked: linkedProviders,
      deletionStatus: "active",
      deletionRequestedAt: null,
      purgeAt: null,
      lastActivityAt: now,
      display_name: args.displayName ?? undefined,
      onboarding_completed: false,
      createdAt: now,
      updatedAt: now
    });

    return { ok: true as const, hasPassword: nextHasPassword };
  }
});

