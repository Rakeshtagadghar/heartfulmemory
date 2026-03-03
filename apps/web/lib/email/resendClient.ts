import { logError, logWarn } from "../server-log";

export type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type ResendSendResponse = {
  id?: string;
  error?: { message?: string };
};

function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY || "",
    from: process.env.RESEND_FROM_EMAIL || ""
  };
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const config = getResendConfig();
  if (!config.apiKey || !config.from) {
    logWarn("auth_email_config_missing", {
      hasApiKey: Boolean(config.apiKey),
      hasFromEmail: Boolean(config.from)
    });
    return { ok: false as const, skipped: true as const, error: "Email provider not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    const payload = (await response.json().catch(() => ({}))) as ResendSendResponse;

    if (!response.ok) {
      logError("auth_email_send_failed", {
        status: response.status,
        statusText: response.statusText,
        message: payload.error?.message || "unknown"
      });
      return {
        ok: false as const,
        skipped: false as const,
        error: payload.error?.message || "Failed to send email."
      };
    }

    return { ok: true as const, id: payload.id || null };
  } catch (error) {
    logError("auth_email_send_exception", error);
    return {
      ok: false as const,
      skipped: false as const,
      error: error instanceof Error ? error.message : "Failed to send email."
    };
  }
}