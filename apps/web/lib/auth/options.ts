import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { isValidEmail, normalizeEmail } from "../validation/email";
import { logError } from "../server-log";
import { verifyPassword } from "./passwordHash";
import { anyApi, convexQuery, getConvexUrl } from "../convex/ops";

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

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email || "");
        if (!isValidEmail(email)) return null;

        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        const user = await lookupAuthUserByEmail(email);

        if (user?.passwordHash) {
          if (!password) return null;
          const validPassword = verifyPassword(password, user.passwordHash);
          if (!validPassword) return null;

          return {
            id: user.userId,
            email: user.email ?? email,
            name: user.displayName ?? getDisplayNameFromEmail(email)
          };
        }

        if (password) {
          // Password provided for an account without password credentials.
          return null;
        }

        if (user) {
          return {
            id: user.userId,
            email: user.email ?? email,
            name: user.displayName ?? getDisplayNameFromEmail(email)
          };
        }

        const allowPasswordlessFallback =
          process.env.AUTH_ALLOW_PASSWORDLESS_DEV === "1" || process.env.NODE_ENV !== "production";
        if (!allowPasswordlessFallback) {
          return null;
        }

        // Developer-friendly local auth fallback for migration environments.
        return {
          id: `user:${email}`,
          email,
          name: getDisplayNameFromEmail(email)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || session.user.id;
        session.user.email = token.email || session.user.email;
        session.user.name = token.name || session.user.name;
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
