import { NextResponse } from "next/server";
import { createFlowTokenRecord } from "../../../../../../lib/auth/flowTokens";
import { AUTH_FLOW_COPY, AUTH_FLOW_TTL_MS, AUTH_RATE_LIMITS } from "../../../../../../lib/auth/authFlowConfig";
import { checkRateLimit } from "../../../../../../lib/auth/requestRateLimit";
import { getBaseAppUrl, getClientIp } from "../../../../../../lib/auth/appUrl";
import { findAuthUserByEmail, createAuthFlowToken } from "../../../../../../lib/auth/flowStore";
import { isValidEmail, normalizeEmail } from "../../../../../../lib/validation/email";
import { buildEmailVerificationTemplate } from "../../../../../../lib/email/authTemplates";
import { sendTransactionalEmail } from "../../../../../../lib/email/resendClient";
import { logError } from "../../../../../../lib/server-log";

export const runtime = "nodejs";

function getTooManyRequestsResponse() {
  return NextResponse.json(
    { ok: false, error: "Too many attempts. Please wait a few minutes and try again." },
    { status: 429 }
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { email?: string };
  const email = normalizeEmail(payload.email || "");
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const ipRate = checkRateLimit(`auth:verify-email:ip:${ip}`, AUTH_RATE_LIMITS.emailVerifyRequest.byIp);
  if (ipRate.limited) return getTooManyRequestsResponse();

  const emailRate = checkRateLimit(
    `auth:verify-email:email:${email}`,
    AUTH_RATE_LIMITS.emailVerifyRequest.byEmail
  );
  if (emailRate.limited) return getTooManyRequestsResponse();

  const genericSuccess = NextResponse.json({
    ok: true,
    message: AUTH_FLOW_COPY.verifyRequestSuccess
  });

  try {
    const user = await findAuthUserByEmail(email);
    if (!user) {
      return genericSuccess;
    }

    const { token, tokenHash } = createFlowTokenRecord();
    const expiresAt = Date.now() + AUTH_FLOW_TTL_MS.emailVerification;

    await createAuthFlowToken({
      purpose: "email_verification",
      email,
      tokenHash,
      authSubject: user.userId,
      expiresAt,
      requestIp: ip,
      userAgent: request.headers.get("user-agent") || null
    });

    const actionUrl = `${getBaseAppUrl(request)}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const emailContent = buildEmailVerificationTemplate({
      recipientEmail: email,
      actionUrl
    });

    await sendTransactionalEmail(emailContent);
    return genericSuccess;
  } catch (error) {
    logError("auth_verify_email_request_error", error);
    return genericSuccess;
  }
}