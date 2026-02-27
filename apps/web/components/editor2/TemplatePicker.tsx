"use client";

import { eldersFirstPageTemplates } from "../../content/pageTemplates/elders-first";
import { Button } from "../ui/button";

export function TemplatePicker({
  onApplyTemplate,
  variant = "inline",
  disabled = false
}: {
  onApplyTemplate: (templateId: string) => Promise<void>;
  variant?: "inline" | "panel";
  disabled?: boolean;
}) {
  if (variant === "panel") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/70">
          Add a preset layout to the currently selected page.
        </div>
        <div className="space-y-3">
          {eldersFirstPageTemplates.map((template) => (
            <div key={template.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{template.name}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{template.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
                  {template.frames.length} items
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={disabled}
                className="mt-3 w-full justify-center"
                title={disabled ? "Select a page first" : template.description}
                onClick={() => void onApplyTemplate(template.id)}
              >
                {template.name}
              </Button>
            </div>
          ))}
        </div>
        {disabled ? (
          <p className="text-xs text-amber-100/80">Select a page to insert a layout preset.</p>
        ) : null}
      </div>
    );
  }

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
            disabled={disabled}
            onClick={() => void onApplyTemplate(template.id)}
          >
            {template.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
