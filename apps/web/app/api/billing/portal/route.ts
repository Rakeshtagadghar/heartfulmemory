import { NextResponse } from "next/server";
import { anyApi, convexQuery } from "../../../../lib/convex/ops";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { getStripeClient } from "../../../../lib/stripe/stripeClient";
import { resolveAbsoluteUrl } from "../../../../lib/billing/urls";
import { captureAppError } from "../../../../../../lib/observability/capture";

export const runtime = "nodejs";

type PortalBody = {
  returnUrl?: string;
};

export async function POST(request: Request) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 500 });
  }

  const user = await requireAuthenticatedUser("/app/account/billing");
  let body: PortalBody = {};
  try {
    body = (await request.json()) as PortalBody;
  } catch {
    // optional input; ignore parse failure
  }

  const customer = await convexQuery<{
    stripeCustomerId: string;
  } | null>(anyApi.billing.getCustomerForViewer, {
    viewerSubject: user.id
  });
  if (!customer.ok) {
    return NextResponse.json({ ok: false, error: customer.error }, { status: 500 });
  }
  if (!customer.data?.stripeCustomerId) {
    return NextResponse.json(
      { ok: false, error: "No billing customer found yet. Upgrade first." },
      { status: 409 }
    );
  }

  const returnUrl = resolveAbsoluteUrl({
    requestUrl: request.url,
    value: body.returnUrl,
    fallbackPath: "/app/account/billing"
  });

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.data.stripeCustomerId,
      return_url: returnUrl
    });
    return NextResponse.json({ ok: true, portalUrl: session.url });
  } catch (error) {
    captureAppError(error, {
      runtime: "server",
      flow: "billing_portal",
      feature: "billing",
      code: "STRIPE_PORTAL_CREATE_FAILED",
      extra: {
        userId: user.id
      }
    });
    return NextResponse.json(
      { ok: false, error: "Unable to create billing portal session." },
      { status: 502 }
    );
  }
}

