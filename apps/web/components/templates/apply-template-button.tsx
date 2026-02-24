"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";
import { trackStorybookCreateStart, trackTemplateApply } from "../../lib/analytics/events_creation";

export function ApplyTemplateButton({
  templateId,
  chapterCount
}: {
  templateId: string;
  chapterCount: number;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      loading={pending}
      className="w-full justify-center"
      onClick={() => {
        trackStorybookCreateStart({
          source: "templates_gallery",
          kind: "template",
          template_id: templateId
        });
        trackTemplateApply({
          source: "templates_gallery",
          template_id: templateId,
          chapter_count: chapterCount
        });
      }}
    >
      Apply Template
    </Button>
  );
}

