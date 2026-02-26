import { createDefaultCanvasForUser, listPagesByStorybookForUser } from "../data/pages";
import { getStorybookForUser } from "../data/storybooks";

export async function ensureStorybookDocForUser(viewerSubject: string, storybookId: string) {
  const storybook = await getStorybookForUser(viewerSubject, storybookId);
  if (!storybook.ok) return storybook;

  const pages = await listPagesByStorybookForUser(viewerSubject, storybookId);
  if (!pages.ok) {
    return { ok: false as const, error: pages.error };
  }

  if (pages.data.length === 0) {
    const created = await createDefaultCanvasForUser(viewerSubject, storybookId);
    if (!created.ok) {
      return { ok: false as const, error: created.error };
    }
  }

  return { ok: true as const, data: { storybookId } };
}

