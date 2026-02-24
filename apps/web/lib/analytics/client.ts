"use client";

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

type AnalyticsEventDetail = {
  event: string;
  props: AnalyticsProps;
};

function getDefaultProps(): AnalyticsProps {
  if (typeof window === "undefined") return {};

  const url = new URL(window.location.href);
  const utmSource = url.searchParams.get("utm_source");
  const utmCampaign = url.searchParams.get("utm_campaign");
  const utmMedium = url.searchParams.get("utm_medium");

  return {
    referrer: document.referrer || undefined,
    utm_source: utmSource || undefined,
    utm_campaign: utmCampaign || undefined,
    utm_medium: utmMedium || undefined
  };
}

function emitDevEvent(detail: AnalyticsEventDetail) {
  window.dispatchEvent(
    new CustomEvent<AnalyticsEventDetail>("analytics:event", { detail })
  );
}

function emitGa4(event: string, props: AnalyticsProps) {
  if (typeof window === "undefined") return;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const gtag = (window as Window & {
    gtag?: (...args: unknown[]) => void;
  }).gtag;

  if (!measurementId || typeof gtag !== "function") return;
  gtag("event", event, props);
}

export function track(event: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;

  const payload = { ...getDefaultProps(), ...(props ?? {}) };

  emitDevEvent({ event, props: payload });
  emitGa4(event, payload);

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", event, payload);
  }
}

