import { NextResponse } from "next/server";
import { AUTH_RATE_LIMITS } from "../../../../lib/auth/authFlowConfig";
import { checkRateLimit } from "../../../../lib/auth/requestRateLimit";
import { getClientIp } from "../../../../lib/auth/appUrl";
import { requireAuthenticatedUser } from "../../../../lib/auth/server";
import { hashPassword } from "../../../../lib/auth/passwordHash";
import { validatePasswordStrength } from "../../../../lib/auth/passwordPolicy";
import { anyApi, convexMutation, getConvexUrl } from "../../../../lib/convex/ops";
import { getPasswordSetErrorMessage } from "../../../../lib/errors/passwordSetErrors";
import { buildPasswordSetSuccessTemplate } from "../../../../lib/email/authTemplates";
import { sendTransactionalEmail } from "../../../../lib/email/resendClient";
import { logError, logWarn } from "../../../../lib/server-log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser("/account/set-password");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_PASSWORD", error: getPasswordSetErrorMessage("INVALID_PASSWORD") },
      { status: 400 }
    );
  }

  const payload = body as { newPassword?: string };
  const newPassword = payload.newPassword || "";

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.ok) {
    return NextResponse.json(
      { ok: false, code: "INVALID_PASSWORD", error: passwordCheck.message },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const ipRate = checkRateLimit(`account:set-password:ip:${ip}`, AUTH_RATE_LIMITS.setPasswordAttempt.byIp);
  if (ipRate.limited) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", error: getPasswordSetErrorMessage("RATE_LIMITED") },
      { status: 429 }
    );
  }

  const userRate = checkRateLimit(
    `account:set-password:user:${user.id}`,
    AUTH_RATE_LIMITS.setPasswordAttempt.byUser
  );
  if (userRate.limited) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", error: getPasswordSetErrorMessage("RATE_LIMITED") },
      { status: 429 }
    );
  }

  if (!getConvexUrl()) {
    return NextResponse.json(
      { ok: false, code: "CONVEX_ERROR", error: getPasswordSetErrorMessage("CONVEX_ERROR") },
      { status: 500 }
    );
  }

  try {
    const result = await convexMutation<
      | { ok: true; email: string | null; displayName: string | null }
      | { ok: false; code: "already_has_password" | "user_not_found" }
    >(anyApi["account/setPassword"].setPassword, {
      userId: user.id,
      passwordHash: hashPassword(newPassword)
    });

    if (!result.ok) {
      logError("account_set_password_convex_error", result.error);
      return NextResponse.json(
        { ok: false, code: "CONVEX_ERROR", error: getPasswordSetErrorMessage("CONVEX_ERROR") },
        { status: 500 }
      );
    }

    if (!result.data.ok) {
      if (result.data.code === "already_has_password") {
        return NextResponse.json(
          {
            ok: false,
            code: "ALREADY_HAS_PASSWORD",
            error: getPasswordSetErrorMessage("ALREADY_HAS_PASSWORD")
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { ok: false, code: "USER_NOT_FOUND", error: getPasswordSetErrorMessage("USER_NOT_FOUND") },
        { status: 404 }
      );
    }

    logWarn("audit_password_set", { userId: user.id, at: new Date().toISOString() });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const securityUrl = `${baseUrl.replace(/\/$/, "")}/account/set-password`;

    if (result.data.email) {
      try {
        const emailContent = await buildPasswordSetSuccessTemplate({
          recipientEmail: result.data.email,
          securityUrl,
          userName: result.data.displayName ?? undefined
        });
        await sendTransactionalEmail(emailContent);
      } catch (error) {
        logError("account_set_password_email_failed", error);
      }
    }

    return NextResponse.json({ ok: true, message: "Password set successfully." });
  } catch (error) {
    logError("account_set_password_error", error);
    return NextResponse.json(
      { ok: false, code: "UNKNOWN", error: getPasswordSetErrorMessage("UNKNOWN") },
      { status: 500 }
    );
  }
}

