import { redirect } from "next/navigation";
import { getCurrentProfileByUserId } from "../profile";
import { requireAuthenticatedUser } from "./server";

export async function requireUser(pathname = "/app") {
  return requireAuthenticatedUser(pathname);
}

/**
 * Sprint 37 forward-compatible guard.
 * Once delete/undo flows are implemented, pending-deletion accounts are routed
 * away from protected experiences.
 */
export async function requireActiveUser(pathname = "/app") {
  const user = await requireAuthenticatedUser(pathname);
  const profile = await getCurrentProfileByUserId(user.id);
  if (profile?.deletion_status === "pending_deletion") {
    redirect("/account/delete-pending");
  }
  return user;
}

