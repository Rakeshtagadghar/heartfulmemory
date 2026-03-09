import type Stripe from "stripe";
import { anyApi, convexMutation } from "../convex/ops";
import { getStripeClientForBilling } from "../stripe/stripeClientFactory";
import { mapStripeSubscriptionForUpsert } from "../stripe/webhookMapper";

function pickSubscriptionForRecovery(subscriptions: Stripe.Subscription[]) {
  if (subscriptions.length === 0) return null;
  const statusRank: Record<string, number> = {
    active: 5,
    trialing: 4,
    past_due: 3,
    unpaid: 2,
    incomplete: 1,
    canceled: 0,
  };
  return (
    subscriptions
      .slice()
      .sort((a, b) => {
        const rankA = statusRank[a.status] ?? 0;
        const rankB = statusRank[b.status] ?? 0;
        if (rankA !== rankB) return rankB - rankA;
        return b.created - a.created;
      })[0] ?? null
  );
}

export async function recoverBillingSubscriptionForUser(
  userId: string,
  stripeCustomerId: string
) {
  const stripeFactory = getStripeClientForBilling();
  if (!stripeFactory.ok) {
    return {
      ok: false as const,
      code: "BILLING_CONFIG_INVALID",
      message: stripeFactory.error,
    };
  }

  const stripeSubscriptions = await stripeFactory.stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 10,
  });
  const candidate = pickSubscriptionForRecovery(stripeSubscriptions.data);
  if (!candidate) {
    return {
      ok: false as const,
      code: "SUBSCRIPTION_NOT_FOUND",
      message: "No Stripe subscription was found for this customer.",
    };
  }

  const mapped = mapStripeSubscriptionForUpsert({
    subscription: candidate,
    fallbackUserId: userId,
  });
  if (!mapped) {
    return {
      ok: false as const,
      code: "BILLING_MAPPING_FAILED",
      message: "The provider subscription could not be mapped to an app user.",
    };
  }

  const serverToken = process.env.BILLING_RECOVERY_TOKEN ?? "";
  if (!serverToken) {
    return {
      ok: false as const,
      code: "BILLING_RECOVERY_MISCONFIGURED",
      message: "BILLING_RECOVERY_TOKEN is not configured.",
    };
  }

  const upsertResult = await convexMutation<{ ok: boolean }>(
    anyApi.billing.upsertSubscriptionFromRecoveryForViewer,
    {
      serverToken,
      ...mapped,
    }
  );
  if (!upsertResult.ok) {
    return {
      ok: false as const,
      code: "BILLING_RESYNC_FAILED",
      message: upsertResult.error,
    };
  }

  return {
    ok: true as const,
    subscriptionId: mapped.stripeSubscriptionId,
    status: mapped.status,
  };
}
