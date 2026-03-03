import { renderEmail as renderEmailTemplate, type TemplateId, type RenderedEmail } from "@memorioso/emails";

export type EmailTemplateId = TemplateId;

export async function renderEmail(templateId: EmailTemplateId, vars: unknown): Promise<RenderedEmail> {
  return renderEmailTemplate(templateId, vars);
}