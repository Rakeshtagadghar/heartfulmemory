import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEventMock = vi.fn();
const retrieveSubscriptionMock = vi.fn();
const convexMutationMock = vi.fn();
const convexQueryMock = vi.fn();
const mapSubscriptionMock = vi.fn();

vi.mock("../../lib/stripe/stripeClient", () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: constructEventMock
    },
    subscriptions: {
      retrieve: retrieveSubscriptionMock
    }
  }),
  getStripeWebhookSecret: () => "whsec_test"
}));

vi.mock("../../lib/convex/ops", () => ({
  anyApi: {
    billing: {
      getCustomerByStripeCustomerIdInternal: "getCustomerByStripeCustomerIdInternal",
      upsertSubscriptionFromStripeInternal: "upsertSubscriptionFromStripeInternal",
      upsertCustomerFromStripeInternal: "upsertCustomerFromStripeInternal"
    }
  },
  convexMutation: (...args: unknown[]) => convexMutationMock(...args),
  convexQuery: (...args: unknown[]) => convexQueryMock(...args)
}));

vi.mock("../../lib/stripe/webhookMapper", () => ({
  mapStripeSubscriptionForUpsert: (...args: unknown[]) => mapSubscriptionMock(...args)
}));

vi.mock("../../../../lib/observability/capture", () => ({
  captureAppError: vi.fn(),
  captureAppWarning: vi.fn()
}));

import { POST } from "../../app/api/stripe/webhook/route";

function createWebhookRequest() {
  return new Request("https://example.com/api/stripe/webhook", {
    method: "POST",
    headers: {
      "stripe-signature": "sig_test"
    },
    body: "{}"
  });
}

describe("stripe webhook idempotency behavior", () => {
  beforeEach(() => {
    constructEventMock.mockReset();
    retrieveSubscriptionMock.mockReset();
    convexMutationMock.mockReset();
    convexQueryMock.mockReset();
    mapSubscriptionMock.mockReset();
  });

  it("handles duplicate customer.subscription.updated event ids safely", async () => {
    const event = {
      id: "evt_duplicate_1",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_123",
          status: "active"
        }
      }
    } as unknown as Stripe.Event;

    constructEventMock.mockReturnValue(event);
    convexQueryMock.mockResolvedValue({ ok: true, data: { userId: "user_123" } });
    mapSubscriptionMock.mockReturnValue({
      userId: "user_123",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      planId: "pro",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      latestInvoiceId: null
    });
    convexMutationMock
      .mockResolvedValueOnce({ ok: true, data: { ok: true, deduped: false } })
      .mockResolvedValueOnce({ ok: true, data: { ok: true, deduped: true } });

    const first = await POST(createWebhookRequest());
    const second = await POST(createWebhookRequest());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(convexMutationMock).toHaveBeenCalledTimes(2);
    expect(convexMutationMock).toHaveBeenNthCalledWith(
      1,
      "upsertSubscriptionFromStripeInternal",
      expect.objectContaining({ stripeEventId: "evt_duplicate_1" })
    );
    expect(convexMutationMock).toHaveBeenNthCalledWith(
      2,
      "upsertSubscriptionFromStripeInternal",
      expect.objectContaining({ stripeEventId: "evt_duplicate_1" })
    );
  });
});
