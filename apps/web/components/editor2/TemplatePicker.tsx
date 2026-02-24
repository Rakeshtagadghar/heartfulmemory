"use client";

import { eldersFirstPageTemplates } from "../../content/pageTemplates/elders-first";
import { Button } from "../ui/button";

export function TemplatePicker({
  onApplyTemplate
}: {
  onApplyTemplate: (templateId: string) => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs uppercase tracking-[0.14em] text-white/50">Layouts</p>
      <div className="flex flex-wrap gap-2">
        {eldersFirstPageTemplates.map((template) => (
          <Button
            key={template.id}
            type="button"
            size="sm"
            variant="ghost"
            title={template.description}
            onClick={() => void onApplyTemplate(template.id)}
          >
            {template.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

