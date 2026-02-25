import { requireAuthenticatedUser } from "../auth/server";

export async function requireExportAccess(storybookId: string) {
  // Ownership/collaborator enforcement is currently applied by downstream Convex queries/mutations
  // using viewerSubject. This wrapper centralizes export-specific authz entry points for Sprint 16.
  return requireAuthenticatedUser(`/app/storybooks/${storybookId}/layout`);
}

