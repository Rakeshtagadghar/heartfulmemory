import type { DefaultSession } from "next-auth";

type AuthProvider = "google" | "password" | "otp" | "magic_link";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      authProvider?: AuthProvider;
      hasPassword?: boolean;
    };
  }

  interface User {
    authProvider?: AuthProvider;
    hasPassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: AuthProvider;
    hasPassword?: boolean;
  }
}
