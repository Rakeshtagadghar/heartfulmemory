import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { isValidEmail, normalizeEmail } from "../validation/email";
import { logError } from "../server-log";
import { verifyPassword } from "./passwordHash";
import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { consumeAuthFlowToken } from "./flowStore";
import { hashFlowToken } from "./flowTokens";
import { googleAuthorizationParams } from "./googleOAuthParams";

type AuthProvider = "google" | "password" | "otp" | "magic_link";

function getDisplayNameFromEmail(email: string) {
  const [localPart] = email.split("@");
  return localPart
    ? localPart
        .replaceAll(/[._-]+/g, " ")
        .replaceAll(/\b\w/g, (char) => char.toUpperCase())
    : "Memorioso Member";
}

function metadataHasDecryptFailure(metadata: unknown) {
  if (!metadata) return false;
  if (typeof metadata === "string") {
    return metadata.toLowerCase().includes("decryption operation failed");
  }
  if (metadata instanceof Error) {
    return metadata.message.toLowerCase().includes("decryption operation failed");
  }

  try {
    return JSON.stringify(metadata).toLowerCase().includes("decryption operation failed");
  } catch {
    return false;
  }
}

type AuthUserLookup = {
  userId: string;
  email: string | null;
  displayName: string | null;
  passwordHash: string | null;
  emailVerifiedAt: number | null;
  hasPassword: boolean;
};

async function lookupAuthUserByEmail(email: string): Promise<AuthUserLookup | null> {
  if (!getConvexUrl()) return null;

  const result = await convexQuery<AuthUserLookup | null>(anyApi.users.getUserByEmailForAuth, {
    email
  });

  if (!result.ok) {
    logError("auth_lookup_user_failed", result.error);
    return null;
  }

  return result.data;
}

function getGoogleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) return null;

  return GoogleProvider({
    clientId,
    clientSecret,
    authorization: {
      params: googleAuthorizationParams
    }
  });
}

async function getLinkedSessionSubject(email: string, fallbackUserId: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await lookupAuthUserByEmail(normalizedEmail);
  return existing?.userId || fallbackUserId;
}

async function syncPostLoginProfile(args: {
  userId: string;
  email: string | null;
  displayName: string | null;
  authProvider: AuthProvider;
  hasPassword: boolean;
  emailVerified: boolean;
}) {
  if (!getConvexUrl()) return;

  const response = await convexMutation<{ ok: boolean }>(anyApi.authHooks.syncPostLogin, {
    userId: args.userId,
    email: args.email,
    displayName: args.displayName,
    authProvider: args.authProvider,
    hasPassword: args.hasPassword,
    emailVerified: args.emailVerified
  });

  if (!response.ok || !response.data.ok) {
    logError("auth_sync_post_login_failed", response.ok ? response.data : response.error);
  }
}

const providers = [
  CredentialsProvider({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      magicToken: { label: "Magic token", type: "text" }
    },
    async authorize(credentials) {
      const magicToken =
        typeof credentials?.magicToken === "string" ? credentials.magicToken.trim() : "";

      if (magicToken) {
        const consumed = await consumeAuthFlowToken("email_sign_in", hashFlowToken(magicToken));
        if (!consumed.ok) return null;

        const signInEmail = normalizeEmail(consumed.email);
        const linkedUser = await lookupAuthUserByEmail(signInEmail);
        if (linkedUser) {
          return {
            id: linkedUser.userId,
            email: linkedUser.email ?? signInEmail,
            name: linkedUser.displayName ?? getDisplayNameFromEmail(signInEmail),
            authProvider: "magic_link" as const,
            hasPassword: linkedUser.hasPassword
          };
        }

        return {
          id: `user:${signInEmail}`,
          email: signInEmail,
          name: getDisplayNameFromEmail(signInEmail),
          authProvider: "magic_link" as const,
          hasPassword: false
        };
      }

      const email = normalizeEmail(credentials?.email || "");
      if (!isValidEmail(email)) return null;

      const password = typeof credentials?.password === "string" ? credentials.password : "";
      const user = await lookupAuthUserByEmail(email);

      if (user?.passwordHash) {
        if (!password) return null;
        const validPassword = verifyPassword(password, user.passwordHash);
        if (!validPassword) return null;

        return {
          id: user.userId,
          email: user.email ?? email,
          name: user.displayName ?? getDisplayNameFromEmail(email),
          authProvider: "password" as const,
          hasPassword: true
        };
      }

      if (password) {
        // Password provided for an account without password credentials.
        return null;
      }

      const allowPasswordlessFallback =
        process.env.AUTH_ALLOW_PASSWORDLESS_DEV === "1" || process.env.NODE_ENV !== "production";

      if (user && allowPasswordlessFallback) {
        return {
          id: user.userId,
          email: user.email ?? email,
          name: user.displayName ?? getDisplayNameFromEmail(email),
          authProvider: "magic_link" as const,
          hasPassword: user.hasPassword
        };
      }

      if (!allowPasswordlessFallback) {
        return null;
      }

      // Developer-friendly local auth fallback for migration environments.
      return {
        id: `user:${email}`,
        email,
        name: getDisplayNameFromEmail(email),
        authProvider: "magic_link" as const,
        hasPassword: false
      };
    }
  })
] as NextAuthOptions["providers"];

const googleProvider = getGoogleProvider();
if (googleProvider) {
  providers.push(googleProvider);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in"
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      const email = typeof user.email === "string" ? normalizeEmail(user.email) : null;
      const resolvedUserId = email ? await getLinkedSessionSubject(email, user.id) : user.id;
      const providerFromAccount = account?.provider === "google" ? "google" : null;
      const providerFromUser =
        user.authProvider === "google" ||
        user.authProvider === "password" ||
        user.authProvider === "otp" ||
        user.authProvider === "magic_link"
          ? user.authProvider
          : null;
      const authProvider = providerFromAccount || providerFromUser || "magic_link";
      const hasPassword =
        typeof user.hasPassword === "boolean" ? user.hasPassword : authProvider === "password";

      user.id = resolvedUserId;
      user.authProvider = authProvider;
      user.hasPassword = hasPassword;

      await syncPostLoginProfile({
        userId: resolvedUserId,
        email,
        displayName: typeof user.name === "string" ? user.name : null,
        authProvider,
        hasPassword,
        emailVerified: authProvider === "google" || authProvider === "password"
      });

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const email = typeof user.email === "string" ? user.email : "";
        token.sub = email ? await getLinkedSessionSubject(email, user.id) : user.id;
        token.email = user.email;
        token.name = user.name;

        const providerFromAccount = account?.provider === "google" ? "google" : undefined;
        token.authProvider = providerFromAccount || user.authProvider || token.authProvider;
        if (typeof user.hasPassword === "boolean") {
          token.hasPassword = user.hasPassword;
        } else if (token.authProvider === "password") {
          token.hasPassword = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || session.user.id;
        session.user.email = token.email || session.user.email;
        session.user.name = token.name || session.user.name;
        if (
          token.authProvider === "google" ||
          token.authProvider === "password" ||
          token.authProvider === "otp" ||
          token.authProvider === "magic_link"
        ) {
          session.user.authProvider = token.authProvider;
        }
        if (typeof token.hasPassword === "boolean") {
          session.user.hasPassword = token.hasPassword;
        }
      }
      return session;
    }
  },
  logger: {
    error(code, metadata) {
      // Expected when NEXTAUTH_SECRET changes and a stale cookie remains in the browser.
      if (code === "JWT_SESSION_ERROR" && metadataHasDecryptFailure(metadata)) {
        return;
      }

      logError(`next-auth:${code}`, metadata ?? "");
    }
  }
};
