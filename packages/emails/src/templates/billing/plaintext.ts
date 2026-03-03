import type { PaymentFailedVars, SubscriptionActiveVars } from "../../contracts/billing";

function getGreeting(name?: string) {
  if (!name) return "Hello,";
  return `Hello ${name},`;
}

export function subscriptionActivePlainText(vars: SubscriptionActiveVars) {
  return [
    getGreeting(vars.userName),
    "",
    `Your ${vars.planName} plan is now active.`,
    `Manage billing: ${vars.manageBillingUrl}`,
    "",
    `Support: ${vars.supportUrl}`
  ].join("\n");
}

export function paymentFailedPlainText(vars: PaymentFailedVars) {
  return [
    getGreeting(vars.userName),
    "",
    "We could not process your payment.",
    `Please update your billing method before ${vars.retryDate}.`,
    `Manage billing: ${vars.manageBillingUrl}`,
    "",
    `Support: ${vars.supportUrl}`
  ].join("\n");
}
