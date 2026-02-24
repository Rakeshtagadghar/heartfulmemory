import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./options";
import { logWarn } from "../server-log";

export function getSafeReturnTo(value: string | null | undefined, fallback = "/app") {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  return value;
}

export async function getAuthSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Common during local development after rotating NEXTAUTH_SECRET or cookies.
    if (message.toLowerCase().includes("decryption operation failed")) {
      logWarn("nextauth_session_decrypt_failed");
      return null;
    }

    throw error;
  }
}

export async function requireAuthenticatedUser(pathname = "/app") {
  const session = await getAuthSession();
  const user = session?.user;

  if (!user?.id) {
    const params = new URLSearchParams({ returnTo: pathname });
    redirect(`/login?${params.toString()}`);
  }

  return user;
}
