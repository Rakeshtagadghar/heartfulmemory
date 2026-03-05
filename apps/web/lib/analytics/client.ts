"use client";

import { getAnalyticsContext, isAnalyticsTrackingAllowed } from "./context";
import {
  getMissingCanonicalParams,
  isCanonicalAnalyticsEventName,
  type AnalyticsProps,
  type CanonicalAnalyticsEventMap,
  type CanonicalAnalyticsEventName,
} from "./events";
import { sanitizeAnalyticsProps } from "./sanitize";

type AnalyticsEventDetail = {
  event: string;
  props: AnalyticsProps;
};

function emitDevEvent(detail: AnalyticsEventDetail) {
  window.dispatchEvent(
    new CustomEvent<AnalyticsEventDetail>("analytics:event", { detail }),
  );
}

function emitGa4(event: string, props: AnalyticsProps) {
  if (typeof window === "undefined") return;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const gtag = (
    window as Window & {
      gtag?: (...args: unknown[]) => void;
    }
  ).gtag;

  if (!measurementId || typeof gtag !== "function") return;
  gtag("event", event, props);
}

function isDisabledByFeatureFlag(event: string) {
  const raw = process.env.NEXT_PUBLIC_ANALYTICS_DISABLED_EVENTS;
  if (!raw) return false;
  const disabled = new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
  return disabled.has(event);
}

export function track<E extends CanonicalAnalyticsEventName>(
  event: E,
  props: CanonicalAnalyticsEventMap[E],
): void;
export function track(event: string, props?: AnalyticsProps): void;
export function track(event: string, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsTrackingAllowed()) return;
  if (isDisabledByFeatureFlag(event)) return;

  const payloadWithContext = {
    ...getAnalyticsContext(),
    ...(props ?? {}),
  };
  const { props: payload, redactedKeys } =
    sanitizeAnalyticsProps(payloadWithContext);

  if (isCanonicalAnalyticsEventName(event)) {
    const missing = getMissingCanonicalParams(event, payload);
    if (missing.length > 0) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[analytics] missing required params for ${event}: ${missing.join(", ")}`,
        );
      }
      return;
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(`[analytics] legacy event name in use: ${event}`);
  }

  emitDevEvent({ event, props: payload });
  emitGa4(event, payload);

  if (process.env.NODE_ENV !== "production") {
    if (redactedKeys.length > 0) {
      console.warn(
        `[analytics] redacted fields for ${event}: ${redactedKeys.join(", ")}`,
      );
    }
    console.info("[analytics]", event, payload);
  }
}

export {
  type CanonicalAnalyticsEventName,
  type CanonicalAnalyticsEventMap,
  type AnalyticsProps,
} from "./events";
export { clearAnalyticsUserContext, setAnalyticsUserContext } from "./context";
