"use client";

import type { MouseEvent } from "react";
import type { ComponentProps } from "react";
import { Button } from "../ui/button";
import {
  trackCreateFreeformChoose,
  trackTemplateSelectChoose
} from "../../lib/analytics/createFlow";

export function TrackedCreateSubmitButton({
  children,
  mode,
  templateId,
  ...props
}: ComponentProps<typeof Button> & {
  mode: "template" | "freeform";
  templateId?: string;
}) {
  return (
    <Button
      {...props}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (mode === "template" && templateId) {
          trackTemplateSelectChoose(templateId);
        }
        if (mode === "freeform") {
          trackCreateFreeformChoose();
        }
        props.onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
