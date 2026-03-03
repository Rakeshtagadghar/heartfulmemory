import { POST as requestReset, __authResetRequestTestUtils } from "../../app/api/auth/password/reset/request/route";
import { POST as verifyReset } from "../../app/api/auth/password/reset/verify/route";
import { POST as confirmEmailVerify } from "../../app/api/auth/email/verify/confirm/route";
import { createAuthFlowToken, __authFlowTestUtils } from "../../lib/auth/flowStore";
import { hashFlowToken } from "../../lib/auth/flowTokens";
import { clearRateLimitStore } from "../../lib/auth/requestRateLimit";

describe("auth reset and verification flows", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    delete process.env.CONVEX_URL;
    clearRateLimitStore();
    __authFlowTestUtils.clearFallbackStore();
    __authResetRequestTestUtils.resetState();
  });

  it("rejects invalid email on reset request", async () => {
    const response = await requestReset(
      new Request("http://localhost:3000/api/auth/password/reset/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.10"
        },
        body: JSON.stringify({ email: "not-an-email" })
      })
    );

    const body = (await response.json()) as { ok: boolean; error?: string };

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toContain("valid email");
  });

  it("rate limits repeated reset requests by email", async () => {
    const makeRequest = () =>
      requestReset(
        new Request("http://localhost:3000/api/auth/password/reset/request", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.11"
          },
          body: JSON.stringify({ email: "user@example.com" })
        })
      );

    const first = await makeRequest();
    const second = await makeRequest();
    const third = await makeRequest();
    const fourth = await makeRequest();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(200);
    expect(fourth.status).toBe(429);
  });

  it("consumes a valid reset token and prevents reuse", async () => {
    const rawToken = "token-reset-123";

    await createAuthFlowToken({
      purpose: "password_reset",
      email: "user@example.com",
      tokenHash: hashFlowToken(rawToken),
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    const makeVerifyRequest = () =>
      verifyReset(
        new Request("http://localhost:3000/api/auth/password/reset/verify", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.12"
          },
          body: JSON.stringify({ token: rawToken, password: "storybook123" })
        })
      );

    const first = await makeVerifyRequest();
    const firstBody = (await first.json()) as { ok: boolean };

    const second = await makeVerifyRequest();
    const secondBody = (await second.json()) as { ok: boolean; error?: string };

    expect(first.status).toBe(200);
    expect(firstBody.ok).toBe(true);

    expect(second.status).toBe(400);
    expect(secondBody.ok).toBe(false);
    expect(secondBody.error).toContain("already been used");
  });

  it("rejects weak passwords during reset verify", async () => {
    const response = await verifyReset(
      new Request("http://localhost:3000/api/auth/password/reset/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.13"
        },
        body: JSON.stringify({ token: "something", password: "short" })
      })
    );

    const body = (await response.json()) as { ok: boolean; error?: string };

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toContain("at least 8");
  });

  it("verifies email token once and then rejects reuse", async () => {
    const rawToken = "token-verify-123";

    await createAuthFlowToken({
      purpose: "email_verification",
      email: "user@example.com",
      tokenHash: hashFlowToken(rawToken),
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    const makeVerifyRequest = () =>
      confirmEmailVerify(
        new Request("http://localhost:3000/api/auth/email/verify/confirm", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.14"
          },
          body: JSON.stringify({ token: rawToken })
        })
      );

    const first = await makeVerifyRequest();
    const firstBody = (await first.json()) as { ok: boolean };

    const second = await makeVerifyRequest();
    const secondBody = (await second.json()) as { ok: boolean; error?: string };

    expect(first.status).toBe(200);
    expect(firstBody.ok).toBe(true);

    expect(second.status).toBe(400);
    expect(secondBody.ok).toBe(false);
  });
});