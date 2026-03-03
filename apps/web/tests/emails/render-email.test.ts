import {
  TemplateValidationError,
  emailAbsoluteUrl,
  emailDefaultLogoUrl,
  emailDefaultSupportUrl,
  renderAuthEmail,
  renderBillingEmail,
  renderEmail
} from "@memorioso/emails";
import { validateTemplateVars } from "../../lib/email/validateTemplateVars";

describe("email template rendering", () => {
  it("renders verify email with logo and CTA", async () => {
    const result = await renderAuthEmail("verify_email", {
      userName: "Asha",
      verifyUrl: emailAbsoluteUrl("/auth/verify-email?token=test"),
      expiryMinutes: 30,
      supportUrl: emailDefaultSupportUrl,
      appName: "Memorioso",
      logoUrl: emailDefaultLogoUrl
    });

    expect(result.subject).toContain("Verify your email");
    expect(result.html).toContain("memorioso-email-logo.png");
    expect(result.text).toContain("verify");
    expect(result.html).toMatchSnapshot();
  });

  it("renders billing payment failed template", async () => {
    const result = await renderBillingEmail("payment_failed", {
      userName: "Asha",
      manageBillingUrl: emailAbsoluteUrl("/account/billing"),
      retryDate: "March 10, 2026",
      supportUrl: emailDefaultSupportUrl,
      appName: "Memorioso"
    });

    expect(result.subject).toContain("Payment failed");
    expect(result.html).toContain("Update billing method");
    expect(result.text).toContain("March 10, 2026");
    expect(result.html).toMatchSnapshot();
  });

  it("supports generic renderEmail entrypoint", async () => {
    const result = await renderEmail("subscription_active", {
      userName: "Asha",
      planName: "Memorioso Pro",
      manageBillingUrl: emailAbsoluteUrl("/account/billing"),
      supportUrl: emailDefaultSupportUrl
    });

    expect(result.subject).toContain("Memorioso Pro");
  });

  it("returns missing vars from app validation helper", () => {
    const result = validateTemplateVars("verify_email", {
      supportUrl: emailDefaultSupportUrl
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missingVarNames).toContain("verifyUrl");
    }
  });

  it("throws template validation error on invalid vars", async () => {
    await expect(
      renderAuthEmail("reset_password", {
        resetUrl: "invalid-url",
        expiryMinutes: 30,
        supportUrl: emailDefaultSupportUrl
      } as never)
    ).rejects.toBeInstanceOf(TemplateValidationError);
  });
});
