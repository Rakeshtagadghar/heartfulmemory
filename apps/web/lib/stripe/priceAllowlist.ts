export type AllowedBillingPrice = {
  priceId: string;
  planId: "pro";
  cadence: "monthly" | "annual";
};

function readEnv(name: string) {
  const value = process.env[name]?.trim() ?? "";
  return value.length > 0 ? value : null;
}

export function getAllowedBillingPrices(): AllowedBillingPrice[] {
  const monthly = readEnv("STRIPE_PRICE_ID_PRO_MONTHLY");
  const annual = readEnv("STRIPE_PRICE_ID_PRO_ANNUAL");
  const prices: AllowedBillingPrice[] = [];
  if (monthly) prices.push({ priceId: monthly, planId: "pro", cadence: "monthly" });
  if (annual) prices.push({ priceId: annual, planId: "pro", cadence: "annual" });
  return prices;
}

export function getAllowedPriceById(priceId: string) {
  return getAllowedBillingPrices().find((entry) => entry.priceId === priceId) ?? null;
}

export function getAllowedPriceByCadence(cadence: AllowedBillingPrice["cadence"]) {
  return getAllowedBillingPrices().find((entry) => entry.cadence === cadence) ?? null;
}
