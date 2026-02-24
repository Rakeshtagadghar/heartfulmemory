import { anyApi, convexMutation, getConvexUrl } from "../convex/ops";
import { type DataResult } from "../data/_shared";
import { starterTemplatesV1 } from "./starter-templates";

export async function applyStarterTemplateForUser(
  viewerSubject: string,
  templateId: string
): Promise<DataResult<{ storybookId: string; templateId: string; templateVersion: number }>> {
  if (!getConvexUrl()) {
    return { ok: false, error: "Convex is not configured." };
  }

  if (!starterTemplatesV1.some((template) => template.id === templateId)) {
    return { ok: false, error: "Unknown template." };
  }

  const result = await convexMutation<{ storybookId: string; templateId: string; templateVersion: number }>(
    anyApi.templates.apply,
    {
      viewerSubject,
      templateId
    }
  );

  if (!result.ok) return result;
  return { ok: true, data: result.data };
}

// Backward-compatible wrapper.
export async function applyStarterTemplate(templateId: string, viewerSubject = "dev:anonymous") {
  return applyStarterTemplateForUser(viewerSubject, templateId);
}
