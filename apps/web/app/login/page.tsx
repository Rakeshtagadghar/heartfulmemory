import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyLoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const params = new URLSearchParams();

  const returnTo = firstParam(query.returnTo);
  const loggedOut = firstParam(query.loggedOut);
  const token = firstParam(query.token);
  const error = firstParam(query.error);
  const message = firstParam(query.message);
  const config = firstParam(query.config);

  if (returnTo) params.set("returnTo", returnTo);
  if (loggedOut) params.set("loggedOut", loggedOut);
  if (token) params.set("token", token);
  if (error) params.set("error", error);
  if (message) params.set("message", message);
  if (config) params.set("config", config);

  const suffix = params.toString();
  redirect(suffix ? `/auth/sign-in?${suffix}` : "/auth/sign-in");
}

