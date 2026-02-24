import { ViewportEvent } from "../viewport-event";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ApplyTemplateButton } from "./apply-template-button";

export type TemplateCardData = {
  id: string;
  templateVersion: number;
  name: string;
  shortDescription: string;
  chapters: readonly string[];
};

export function TemplateCard({
  template,
  action
}: {
  template: TemplateCardData;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <ViewportEvent
        eventName="template_view"
        eventProps={{ template_id: template.id, template_version: template.templateVersion }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{template.name}</Badge>
          <span className="text-xs uppercase tracking-[0.14em] text-white/45">
            v{template.templateVersion}
          </span>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-parchment">{template.name}</h2>
          <p className="mt-2 text-sm leading-7 text-white/70">{template.shortDescription}</p>
        </div>

        <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Preview chapters</p>
            <p className="text-xs text-white/60">{template.chapters.length} chapters</p>
          </div>
          <ul className="grid gap-1 text-sm text-white/75">
            {template.chapters.slice(0, 4).map((chapterTitle) => (
              <li key={`${template.id}-${chapterTitle}`} className="truncate">
                {chapterTitle}
              </li>
            ))}
          </ul>
        </div>

        <form action={action} className="space-y-2">
          <input type="hidden" name="templateId" value={template.id} />
          <ApplyTemplateButton templateId={template.id} chapterCount={template.chapters.length} />
        </form>
      </div>
    </Card>
  );
}

