import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

function normalizeProviderFlags(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      google: false,
      password: false,
      otp: false,
      magic_link: false
    };
  }

  const source = value as Record<string, unknown>;
  return {
    google: Boolean(source.google),
    password: Boolean(source.password),
    otp: Boolean(source.otp),
    magic_link: Boolean(source.magic_link)
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

export const setPassword = mutationGeneric({
  args: {
    userId: v.string(),
    passwordHash: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();

    if (!user) {
      return { ok: false as const, code: "user_not_found" as const };
    }

    if (deriveHasPassword(user)) {
      return { ok: false as const, code: "already_has_password" as const };
    }

    const providers = normalizeProviderFlags(user.authProvidersLinked);
    await ctx.db.patch(user._id, {
      passwordHash: args.passwordHash,
      hasPassword: true,
      authProvidersLinked: {
        ...providers,
        password: true
      },
      lastActivityAt: now,
      updatedAt: now
    });

    return {
      ok: true as const,
      email: user.primaryEmail ?? user.email ?? null,
      displayName: user.display_name ?? null
    };
  }
});

