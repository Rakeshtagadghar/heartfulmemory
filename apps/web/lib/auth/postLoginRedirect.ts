import { getSafeReturnTo } from "./server";
import {
  SET_PASSWORD_ROUTE,
  type SetPasswordPolicy,
  setPasswordPolicy
} from "../config/setPasswordPolicy";
import { shouldPromptSetPasswordAfterLogin } from "../../middleware/routeGuards";

type PostLoginRedirectInput = {
  returnTo?: string | null;
  hasPassword: boolean;
  skipUntilMs?: number | null;
  nowMs?: number;
  policy?: SetPasswordPolicy;
};

function buildSetPasswordRedirect(returnTo: string) {
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  return `${SET_PASSWORD_ROUTE}?${params.toString()}`;
}

export function resolvePostLoginRedirect(input: PostLoginRedirectInput) {
  const policy = input.policy || setPasswordPolicy;
  const safeReturnTo = getSafeReturnTo(input.returnTo, "/app");

  if (
    shouldPromptSetPasswordAfterLogin({
      pathname: safeReturnTo,
      hasPassword: input.hasPassword,
      skipUntilMs: input.skipUntilMs,
      nowMs: input.nowMs,
      policy
    })
  ) {
    return buildSetPasswordRedirect(safeReturnTo);
  }

  return safeReturnTo;
}

