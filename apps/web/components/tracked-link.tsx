"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "./analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  eventName?: string;
  eventProps?: Record<string, string | number>;
};

export function TrackedLink({ eventName, eventProps, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (eventName) {
          track(eventName, eventProps);
        }
        onClick?.(event);
      }}
    />
  );
}
