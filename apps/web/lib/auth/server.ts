import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./options";

export function getSafeReturnTo(value: string | null | undefined, fallback = "/app") {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  return value;
}

export async function getAuthSession() {
  return getServerSession(authOptions);
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
