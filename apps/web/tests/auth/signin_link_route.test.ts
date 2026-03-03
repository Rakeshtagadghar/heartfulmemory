import { POST as requestSignInLink } from "../../app/api/auth/email/sign-in/request/route";
import { clearRateLimitStore } from "../../lib/auth/requestRateLimit";
import { __authFlowTestUtils } from "../../lib/auth/flowStore";

describe("email sign-in request route", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    delete process.env.CONVEX_URL;
    clearRateLimitStore();
    __authFlowTestUtils.clearFallbackStore();
  });

  it("returns validation error for invalid email", async () => {
    const response = await requestSignInLink(
      new Request("http://localhost:3000/api/auth/email/sign-in/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.20"
        },
        body: JSON.stringify({ email: "bad" })
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns generic success for valid request", async () => {
    const response = await requestSignInLink(
      new Request("http://localhost:3000/api/auth/email/sign-in/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.21"
        },
        body: JSON.stringify({ email: "user@example.com", returnTo: "/studio" })
      })
    );

    const body = (await response.json()) as { ok: boolean; message?: string };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.message).toContain("sign-in links");
  });

  it("rate limits repeated requests per email", async () => {
    const makeRequest = () =>
      requestSignInLink(
        new Request("http://localhost:3000/api/auth/email/sign-in/request", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.22"
          },
          body: JSON.stringify({ email: "user@example.com" })
        })
      );

    const responses = await Promise.all([
      makeRequest(),
      makeRequest(),
      makeRequest(),
      makeRequest(),
      makeRequest(),
      makeRequest()
    ]);

    expect(responses[4]?.status).toBe(200);
    expect(responses[5]?.status).toBe(429);
  });
});