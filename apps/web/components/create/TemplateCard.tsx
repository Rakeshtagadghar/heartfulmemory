import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { TrackedCreateSubmitButton } from "./TrackedCreateSubmitButton";
import type { GuidedTemplateForCreate } from "../../lib/data/create-flow";

export function TemplateCard({
  template,
  clientRequestId,
  action
}: {
  template: GuidedTemplateForCreate;
  clientRequestId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-white/15 bg-white/[0.03] text-white/85">{template.title}</Badge>
          <span className="text-xs uppercase tracking-[0.16em] text-white/45">v{template.version}</span>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-parchment">{template.title}</h2>
          <p className="mt-2 text-sm leading-7 text-white/70">{template.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Chapters</p>
            <p className="text-xs text-white/60">{template.chapterCount}</p>
          </div>
          <ul className="grid gap-2 text-sm text-white/80">
            {template.chapters.map((chapter) => (
              <li
                key={`${template.templateId}-${chapter.chapterKey}`}
                className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.015] px-3 py-2"
              >
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                <div>
                  <p className="font-medium text-white/90">{chapter.title}</p>
                  {chapter.subtitle ? (
                    <p className="text-xs leading-5 text-white/55">{chapter.subtitle}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form action={action}>
          <input type="hidden" name="templateId" value={template.templateId} />
          <input type="hidden" name="clientRequestId" value={clientRequestId} />
          <TrackedCreateSubmitButton
            type="submit"
            size="lg"
            className="w-full justify-center"
            mode="template"
            templateId={template.templateId}
          >
            Use Template
          </TrackedCreateSubmitButton>
        </form>
      </div>
    </Card>
  );
}
