import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrCreateProfileForUser } from "../../../lib/profile";
import { resolvePostLoginRedirect } from "../../../lib/auth/postLoginRedirect";
import { getSafeReturnTo, requireAuthenticatedUser } from "../../../lib/auth/server";
import { SET_PASSWORD_SKIP_COOKIE } from "../../../lib/config/setPasswordPolicy";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PostLoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const user = await requireAuthenticatedUser("/auth/post-login");
  const profile = await getOrCreateProfileForUser(user);

  const cookieStore = await cookies();
  const skipRaw = cookieStore.get(SET_PASSWORD_SKIP_COOKIE)?.value;
  const skipUntilMs = skipRaw ? Number(skipRaw) : null;

  const returnTo = getSafeReturnTo(typeof query.returnTo === "string" ? query.returnTo : undefined, "/app");
  const target = resolvePostLoginRedirect({
    returnTo,
    hasPassword: Boolean(profile.has_password),
    skipUntilMs: Number.isFinite(skipUntilMs) ? skipUntilMs : null
  });

  redirect(target);
}

