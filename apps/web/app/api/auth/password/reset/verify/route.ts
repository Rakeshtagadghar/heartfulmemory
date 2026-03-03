import { NextResponse } from "next/server";
import { anyApi, convexMutation, getConvexUrl } from "../../../../../../lib/convex/ops";
import { AUTH_FLOW_COPY, AUTH_RATE_LIMITS } from "../../../../../../lib/auth/authFlowConfig";
import { checkRateLimit } from "../../../../../../lib/auth/requestRateLimit";
import { getClientIp } from "../../../../../../lib/auth/appUrl";
import { consumeAuthFlowToken } from "../../../../../../lib/auth/flowStore";
import { hashFlowToken } from "../../../../../../lib/auth/flowTokens";
import { hashPassword } from "../../../../../../lib/auth/passwordHash";
import { validatePasswordStrength } from "../../../../../../lib/auth/passwordPolicy";
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
    password?: string;
  };

  const token = (payload.token || "").trim();
  const password = payload.password || "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "Reset link is missing." }, { status: 400 });
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.ok) {
    return NextResponse.json({ ok: false, error: passwordCheck.message }, { status: 400 });
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
    const result = await consumeAuthFlowToken("password_reset", hashFlowToken(token));
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: getTokenErrorMessage(result.code)
        },
        { status: 400 }
      );
    }

    if (getConvexUrl()) {
      const passwordHash = hashPassword(password);
      const updated = await convexMutation<{ ok: boolean }>(anyApi.users.setPasswordHashByEmail, {
        email: result.email,
        passwordHash
      });
      if (!updated.ok || !updated.data.ok) {
        logError("auth_password_reset_set_hash_failed", updated.ok ? updated.data : updated.error);
        return NextResponse.json(
          { ok: false, error: "Unable to update password right now. Please request a new reset link." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Password updated. You can now sign in with your email and password."
    });
  } catch (error) {
    logError("auth_password_reset_verify_error", error);
    return NextResponse.json({ ok: false, error: "Unable to reset password right now." }, { status: 500 });
  }
}
