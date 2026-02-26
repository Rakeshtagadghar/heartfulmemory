"use client";

import type { ComponentProps, MouseEvent } from "react";
import { Button } from "../ui/button";
import {
  trackWizardStepNext,
  trackWizardStepSkip
} from "../../lib/analytics/createFlow";

export function WizardActionButton({
  eventKind,
  questionId,
  onClick,
  children,
  ...props
}: ComponentProps<typeof Button> & {
  eventKind: "next" | "skip" | "none";
  questionId: string;
}) {
  return (
    <Button
      {...props}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (eventKind === "next") {
          trackWizardStepNext(questionId);
        } else if (eventKind === "skip") {
          trackWizardStepSkip(questionId);
        }
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
