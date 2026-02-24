"use client";

import { useEffect, useRef } from "react";
import { track } from "./analytics";

type Props = {
  eventName: string;
  eventProps?: Record<string, string | number>;
  once?: boolean;
};

export function ViewportEvent({ eventName, eventProps, once = true }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const seenRef = useRef(false);
  const eventPropsKey = eventProps ? JSON.stringify(eventProps) : "";

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const trackedProps = eventPropsKey
      ? (JSON.parse(eventPropsKey) as Props["eventProps"])
      : undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (once && seenRef.current) continue;
          seenRef.current = true;
          track(eventName, trackedProps);
          if (once) observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eventName, once, eventPropsKey]);

  return <span ref={ref} aria-hidden="true" className="block h-0 w-0" />;
}
