import { NextResponse } from "next/server";
import { AUTH_FLOW_COPY, AUTH_RATE_LIMITS } from "../../../../../../lib/auth/authFlowConfig";
import { checkRateLimit } from "../../../../../../lib/auth/requestRateLimit";
import { getClientIp } from "../../../../../../lib/auth/appUrl";
import { consumeAuthFlowToken, markEmailVerifiedByEmail } from "../../../../../../lib/auth/flowStore";
import { hashFlowToken } from "../../../../../../lib/auth/flowTokens";
import { logError } from "../../../../../../lib/server-log";

export const runtime = "nodejs";

function getTokenErrorMessage(code: "invalid_token" | "expired" | "already_used") {
  if (code === "already_used") return AUTH_FLOW_COPY.alreadyUsedToken;
  return AUTH_FLOW_COPY.invalidOrExpiredToken;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as {
    token?: string;
  };

  const token = (payload.token || "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Verification link is missing." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`auth:token:ip:${ip}`, AUTH_RATE_LIMITS.tokenConsume.byIp);
  if (rate.limited) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  try {
    const result = await consumeAuthFlowToken("email_verification", hashFlowToken(token));
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: getTokenErrorMessage(result.code)
        },
        { status: 400 }
      );
    }

    await markEmailVerifiedByEmail(result.email);

    return NextResponse.json({
      ok: true,
      message: "Email verified. You can continue to sign in."
    });
  } catch (error) {
    logError("auth_verify_email_confirm_error", error);
    return NextResponse.json({ ok: false, error: "Unable to verify email right now." }, { status: 500 });
  }
}