import { TemplateCard, type TemplateCardData } from "./template-card";

export function TemplatesGallery({
  templates,
  applyAction
}: {
  templates: readonly TemplateCardData[];
  applyAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} action={applyAction} />
      ))}
    </div>
  );
}

