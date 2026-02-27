"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "../auth/server";
import { createStorybookForUser, removeStorybookForUser, updateStorybookForUser } from "../data/storybooks";
import type { DataResult } from "../data/_shared";
import type { StorybookDTO } from "../dto/storybook";

export async function createBlankStorybookAction(): Promise<never> {
  const user = await requireAuthenticatedUser("/app");
  const result = await createStorybookForUser(user.id, {
    title: "My Storybook",
    bookMode: "DIGITAL"
  });
  if (!result.ok) {
    redirect(`/app?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/app");
  redirect(`/app/storybooks/${result.data.id}?created=1&source=dashboard_blank`);
}

export async function renameStorybookFromDashboardAction(
  storybookId: string,
  patch: { title?: string; subtitle?: string | null }
): Promise<DataResult<StorybookDTO>> {
  const user = await requireAuthenticatedUser("/app");
  const result = await updateStorybookForUser(user.id, storybookId, patch);
  revalidatePath("/app");
  revalidatePath(`/app/storybooks/${storybookId}`);
  return result;
}

export async function removeStorybookFromDashboardAction(
  storybookId: string
): Promise<DataResult<null>> {
  const user = await requireAuthenticatedUser("/app");
  const result = await removeStorybookForUser(user.id, storybookId);
  revalidatePath("/app");
  revalidatePath(`/app/storybooks/${storybookId}`);
  revalidatePath(`/book/${storybookId}/chapters`);
  return result;
}
