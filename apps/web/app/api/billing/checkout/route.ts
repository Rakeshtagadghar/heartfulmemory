import { NextResponse } from "next/server";
import { anyApi, convexMutation, convexQuery } from "../../../../lib/convex/ops";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getStripeClientForBilling } from "../../../../lib/stripe/stripeClientFactory";
import { getAllowedPriceByCadence, getAllowedPriceById } from "../../../../lib/stripe/priceAllowlist";
import { resolveAbsoluteUrl } from "../../../../lib/billing/urls";
import { captureAppError, captureAppWarning } from "../../../../../../lib/observability/capture";

export const runtime = "nodejs";

type CheckoutBody = {
  priceId?: string;
  cadence?: "monthly" | "annual";
  successUrl?: string;
  cancelUrl?: string;
};

export async function POST(request: Request) {
  const stripeFactory = getStripeClientForBilling();
  if (!stripeFactory.ok) {
    return NextResponse.json(
      { ok: false, error: stripeFactory.error },
      { status: 500 }
    );
  }
  const stripe = stripeFactory.stripe;

  const user = await requireAuthenticatedUser("/app");

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const priceId = (body.priceId ?? "").trim();
  const cadence = body.cadence === "annual" ? "annual" : "monthly";
  const allowedPrice = priceId ? getAllowedPriceById(priceId) : getAllowedPriceByCadence(cadence);
  if (!allowedPrice) {
    captureAppWarning("Checkout attempted with disallowed price", {
      runtime: "server",
      flow: "billing_checkout",
      feature: "billing",
      code: "PRICE_NOT_ALLOWED",
      extra: {
        userId: user.id,
        priceId,
        cadence
      }
    });
    return NextResponse.json({ ok: false, error: "Selected price is not allowed." }, { status: 400 });
  }

  const successUrl = resolveAbsoluteUrl({
    requestUrl: request.url,
    value: body.successUrl,
    fallbackPath: "/billing/success"
  });
  const cancelUrl = resolveAbsoluteUrl({
    requestUrl: request.url,
    value: body.cancelUrl,
    fallbackPath: "/billing/cancel"
  });

  const existingCustomer = await convexQuery<{
    stripeCustomerId: string;
  } | null>(anyApi.billing.getCustomerForViewer, {
    viewerSubject: user.id
  });

  if (!existingCustomer.ok) {
    return NextResponse.json({ ok: false, error: existingCustomer.error }, { status: 500 });
  }

  let stripeCustomerId = existingCustomer.data?.stripeCustomerId ?? null;
  if (!stripeCustomerId) {
    try {
      const created = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          app: "memorioso",
          userId: user.id
        }
      });
      stripeCustomerId = created.id;
      const upserted = await convexMutation<{ ok: boolean }>(anyApi.billing.upsertCustomerForViewer, {
        viewerSubject: user.id,
        stripeCustomerId,
        email: user.email ?? null
      });
      if (!upserted.ok) {
        return NextResponse.json({ ok: false, error: upserted.error }, { status: 500 });
      }
    } catch (error) {
      captureAppError(error, {
        runtime: "server",
        flow: "billing_checkout",
        feature: "billing",
        code: "STRIPE_CUSTOMER_CREATE_FAILED",
        extra: {
          userId: user.id
        }
      });
      return NextResponse.json(
        { ok: false, error: "Could not create Stripe customer." },
        { status: 502 }
      );
    }
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: allowedPrice.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata: {
        app: "memorioso",
        userId: user.id,
        planId: allowedPrice.planId
      },
      subscription_data: {
        metadata: {
          app: "memorioso",
          userId: user.id,
          planId: allowedPrice.planId
        }
      }
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { ok: false, error: "Stripe checkout URL is unavailable." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      checkoutUrl: checkoutSession.url
    });
  } catch (error) {
    captureAppError(error, {
      runtime: "server",
      flow: "billing_checkout",
      feature: "billing",
      code: "STRIPE_CHECKOUT_CREATE_FAILED",
      extra: {
        userId: user.id,
        planId: allowedPrice.planId,
        priceId: allowedPrice.priceId
      }
    });
    return NextResponse.json(
      { ok: false, error: "Unable to create checkout session." },
      { status: 502 }
    );
  }
}
