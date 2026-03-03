import { z } from "zod";

const optionalUserName = z.string().trim().min(1).max(80).optional();
const optionalLogoUrl = z.string().url().optional();

export const subscriptionActiveVarsSchema = z.object({
  userName: optionalUserName,
  planName: z.string().trim().min(1).max(60),
  manageBillingUrl: z.string().url(),
  supportUrl: z.string().url(),
  appName: z.string().trim().min(1).max(80).optional(),
  logoUrl: optionalLogoUrl
});

export const paymentFailedVarsSchema = z.object({
  userName: optionalUserName,
  manageBillingUrl: z.string().url(),
  retryDate: z.string().trim().min(3).max(80),
  supportUrl: z.string().url(),
  appName: z.string().trim().min(1).max(80).optional(),
  logoUrl: optionalLogoUrl
});

export type SubscriptionActiveVars = z.infer<typeof subscriptionActiveVarsSchema>;
export type PaymentFailedVars = z.infer<typeof paymentFailedVarsSchema>;

export const billingTemplateIdSchema = z.enum(["subscription_active", "payment_failed"]);
export type BillingTemplateId = z.infer<typeof billingTemplateIdSchema>;