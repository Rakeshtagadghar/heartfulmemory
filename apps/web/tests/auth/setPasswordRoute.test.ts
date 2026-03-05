import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearRateLimitStore } from "../../lib/auth/requestRateLimit";

const requireAuthenticatedUserMock = vi.fn();
const convexMutationMock = vi.fn();
const sendTransactionalEmailMock = vi.fn();
const buildPasswordSetSuccessTemplateMock = vi.fn();

vi.mock("../../lib/auth/server", () => ({
  requireAuthenticatedUser: requireAuthenticatedUserMock
}));

vi.mock("../../lib/convex/ops", () => ({
  anyApi: {
    "account/setPassword": {
      setPassword: "mock:setPassword"
    }
  },
  convexMutation: convexMutationMock,
  getConvexUrl: () => "https://example.convex.cloud"
}));

vi.mock("../../lib/email/resendClient", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock
}));

vi.mock("../../lib/email/authTemplates", () => ({
  buildPasswordSetSuccessTemplate: buildPasswordSetSuccessTemplateMock
}));

describe("POST /api/account/set-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
    requireAuthenticatedUserMock.mockResolvedValue({
      id: "user_123",
      email: "asha@example.com",
      name: "Asha"
    });
    buildPasswordSetSuccessTemplateMock.mockResolvedValue({
      to: "asha@example.com",
      subject: "ok",
      html: "<p>ok</p>",
      text: "ok"
    });
  });

  it("sets password successfully even if confirmation email fails", async () => {
    convexMutationMock.mockResolvedValue({
      ok: true,
      data: { ok: true, email: "asha@example.com", displayName: "Asha" }
    });
    sendTransactionalEmailMock.mockRejectedValue(new Error("provider down"));

    const { POST } = await import("../../app/api/account/set-password/route");
    const response = await POST(
      new Request("http://localhost:3000/api/account/set-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1"
        },
        body: JSON.stringify({ newPassword: "storybook123" })
      })
    );

    const body = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(convexMutationMock).toHaveBeenCalledTimes(1);
    expect(buildPasswordSetSuccessTemplateMock).toHaveBeenCalledTimes(1);
  });

  it("returns conflict when password already exists", async () => {
    convexMutationMock.mockResolvedValue({
      ok: true,
      data: { ok: false, code: "already_has_password" }
    });

    const { POST } = await import("../../app/api/account/set-password/route");
    const response = await POST(
      new Request("http://localhost:3000/api/account/set-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.2"
        },
        body: JSON.stringify({ newPassword: "storybook123" })
      })
    );

    const body = (await response.json()) as { ok: boolean; code: string };
    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("ALREADY_HAS_PASSWORD");
  });
});

