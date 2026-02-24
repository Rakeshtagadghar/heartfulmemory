"use client";

type EventProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, props?: EventProps) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("analytics:event", {
      detail: {
        event,
        props: props ?? {}
      }
    })
  );

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", event, props ?? {});
  }
}
