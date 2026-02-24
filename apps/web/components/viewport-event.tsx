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

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let seen = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (once && seen) continue;
          seen = true;
          track(eventName, eventProps);
          if (once) observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eventName, eventProps, once]);

  return <span ref={ref} aria-hidden="true" className="block h-0 w-0" />;
}
