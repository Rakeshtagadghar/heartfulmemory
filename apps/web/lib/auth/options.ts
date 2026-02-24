import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { isValidEmail, normalizeEmail } from "../validation/email";
import { logError } from "../server-log";

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
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email || "");
        if (!isValidEmail(email)) return null;

        // Developer-friendly local auth fallback for Sprint 3.5 migration.
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
