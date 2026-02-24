import { createChapter } from "../data/chapters";
import { createStorybook } from "../data/storybooks";
import { starterTemplatesV1 } from "./starter-templates";

export async function applyStarterTemplate(templateId: (typeof starterTemplatesV1)[number]["id"]) {
  const template = starterTemplatesV1.find((item) => item.id === templateId);
  if (!template) {
    return { ok: false as const, error: "Unknown template." };
  }

  const storybook = await createStorybook(template.name, "DIGITAL");
  if (!storybook.ok) return storybook;

  for (const chapterTitle of template.chapters) {
    const created = await createChapter(storybook.data.id, chapterTitle);
    if (!created.ok) return created;
  }

  return storybook;
}
