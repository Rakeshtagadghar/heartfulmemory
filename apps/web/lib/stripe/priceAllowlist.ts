import { getBillingRuntimeConfig } from "../config/billingMode";

export type AllowedBillingPrice = {
  priceId: string;
  planId: "pro";
  cadence: "monthly" | "annual";
};

export function getAllowedBillingPrices(): AllowedBillingPrice[] {
  const billing = getBillingRuntimeConfig();
  if (billing.errors.length > 0) return [];

  const prices: AllowedBillingPrice[] = [];
  if (billing.mode === "test") {
    if (billing.stripePriceIdProTest) {
      prices.push({
        priceId: billing.stripePriceIdProTest,
        planId: "pro",
        cadence: "monthly"
      });
    }
    return prices;
  }

  if (billing.stripePriceIdProMonthly) {
    prices.push({ priceId: billing.stripePriceIdProMonthly, planId: "pro", cadence: "monthly" });
  }
  if (billing.stripePriceIdProAnnual) {
    prices.push({ priceId: billing.stripePriceIdProAnnual, planId: "pro", cadence: "annual" });
  }
  return prices;
}

export function getAllowedPriceById(priceId: string) {
  return getAllowedBillingPrices().find((entry) => entry.priceId === priceId) ?? null;
}

export function getAllowedPriceByCadence(cadence: AllowedBillingPrice["cadence"]) {
  return getAllowedBillingPrices().find((entry) => entry.cadence === cadence) ?? null;
}
