import { shouldRequirePasswordForSensitiveRoute } from "../../middleware/routeGuards";
import { getCurrentProfileByUserId } from "../profile";

export async function shouldBlockForMissingPassword(userId: string, pathname: string) {
  const profile = await getCurrentProfileByUserId(userId);
  const hasPassword = Boolean(profile?.has_password);
  const blocked = shouldRequirePasswordForSensitiveRoute({
    pathname,
    hasPassword
  });

  return {
    blocked,
    hasPassword
  };
}

