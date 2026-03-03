import { NextResponse } from "next/server";
import { createFlowTokenRecord } from "../../../../../../lib/auth/flowTokens";
import { AUTH_FLOW_COPY, AUTH_FLOW_TTL_MS, AUTH_RATE_LIMITS } from "../../../../../../lib/auth/authFlowConfig";
import { checkRateLimit, clearRateLimitStore } from "../../../../../../lib/auth/requestRateLimit";
import { getBaseAppUrl, getClientIp } from "../../../../../../lib/auth/appUrl";
import { findAuthUserByEmail, createAuthFlowToken, __authFlowTestUtils } from "../../../../../../lib/auth/flowStore";
import { isValidEmail, normalizeEmail } from "../../../../../../lib/validation/email";
import { buildPasswordResetTemplate } from "../../../../../../lib/email/authTemplates";
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
  const ipRate = checkRateLimit(`auth:reset:ip:${ip}`, AUTH_RATE_LIMITS.passwordResetRequest.byIp);
  if (ipRate.limited) return getTooManyRequestsResponse();

  const emailRate = checkRateLimit(
    `auth:reset:email:${email}`,
    AUTH_RATE_LIMITS.passwordResetRequest.byEmail
  );
  if (emailRate.limited) return getTooManyRequestsResponse();

  const genericSuccess = NextResponse.json({
    ok: true,
    message: AUTH_FLOW_COPY.resetRequestSuccess
  });

  try {
    const user = await findAuthUserByEmail(email);
    if (!user) {
      return genericSuccess;
    }

    const { token, tokenHash } = createFlowTokenRecord();
    const expiresAt = Date.now() + AUTH_FLOW_TTL_MS.passwordReset;

    await createAuthFlowToken({
      purpose: "password_reset",
      email,
      tokenHash,
      authSubject: user.userId,
      expiresAt,
      requestIp: ip,
      userAgent: request.headers.get("user-agent") || null
    });

    const actionUrl = `${getBaseAppUrl(request)}/auth/reset-password/verify?token=${encodeURIComponent(token)}`;
    const emailContent = await buildPasswordResetTemplate({
      recipientEmail: email,
      actionUrl
    });

    await sendTransactionalEmail(emailContent);

    return genericSuccess;
  } catch (error) {
    logError("auth_password_reset_request_error", error);
    return genericSuccess;
  }
}

export const __authResetRequestTestUtils = {
  resetState() {
    clearRateLimitStore();
    __authFlowTestUtils.clearFallbackStore();
  }
};
