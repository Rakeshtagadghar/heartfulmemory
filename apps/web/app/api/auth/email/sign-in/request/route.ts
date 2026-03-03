import { NextResponse } from "next/server";
import { createFlowTokenRecord } from "../../../../../../lib/auth/flowTokens";
import { AUTH_FLOW_COPY, AUTH_FLOW_TTL_MS, AUTH_RATE_LIMITS } from "../../../../../../lib/auth/authFlowConfig";
import { checkRateLimit } from "../../../../../../lib/auth/requestRateLimit";
import { getBaseAppUrl, getClientIp } from "../../../../../../lib/auth/appUrl";
import { createAuthFlowToken } from "../../../../../../lib/auth/flowStore";
import { isValidEmail, normalizeEmail } from "../../../../../../lib/validation/email";
import { buildEmailSignInTemplate } from "../../../../../../lib/email/authTemplates";
import { sendTransactionalEmail } from "../../../../../../lib/email/resendClient";
import { logError } from "../../../../../../lib/server-log";

export const runtime = "nodejs";

function getTooManyRequestsResponse() {
  return NextResponse.json(
    { ok: false, error: "Too many attempts. Please wait a few minutes and try again." },
    { status: 429 }
  );
}

function getSafeReturnTo(value: unknown) {
  if (typeof value !== "string") return "/app";
  if (!value.startsWith("/")) return "/app";
  if (value.startsWith("//")) return "/app";
  return value;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { email?: string; returnTo?: string };
  const email = normalizeEmail(payload.email || "");
  const returnTo = getSafeReturnTo(payload.returnTo);
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const ipRate = checkRateLimit(`auth:email-sign-in:ip:${ip}`, AUTH_RATE_LIMITS.emailSignInRequest.byIp);
  if (ipRate.limited) return getTooManyRequestsResponse();

  const emailRate = checkRateLimit(
    `auth:email-sign-in:email:${email}`,
    AUTH_RATE_LIMITS.emailSignInRequest.byEmail
  );
  if (emailRate.limited) return getTooManyRequestsResponse();

  const genericSuccess = NextResponse.json({
    ok: true,
    message: AUTH_FLOW_COPY.signInLinkRequestSuccess
  });

  try {
    const { token, tokenHash } = createFlowTokenRecord();
    const expiresAt = Date.now() + AUTH_FLOW_TTL_MS.emailSignIn;

    await createAuthFlowToken({
      purpose: "email_sign_in",
      email,
      tokenHash,
      authSubject: null,
      expiresAt,
      requestIp: ip,
      userAgent: request.headers.get("user-agent") || null
    });

    const signInUrl = new URL(`${getBaseAppUrl(request)}/auth/sign-in`);
    signInUrl.searchParams.set("token", token);
    signInUrl.searchParams.set("returnTo", returnTo);

    const emailContent = buildEmailSignInTemplate({
      recipientEmail: email,
      actionUrl: signInUrl.toString()
    });

    await sendTransactionalEmail(emailContent);
    return genericSuccess;
  } catch (error) {
    logError("auth_email_signin_request_error", error);
    return genericSuccess;
  }
}