"use client";

import type { ComponentProps } from "react";
import { Button } from "../ui/button";
import { track } from "../analytics";

export function TrackedIllustrationActionButton({
  eventName,
  eventProps,
  ...props
}: ComponentProps<typeof Button> & {
  eventName?: string;
  eventProps?: Record<string, string | number | boolean | null | undefined>;
}) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        if (eventName) track(eventName, eventProps);
        props.onClick?.(event);
      }}
    />
  );
}

