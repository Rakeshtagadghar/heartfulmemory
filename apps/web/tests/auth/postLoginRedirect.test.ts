import { describe, expect, it } from "vitest";
import { resolvePostLoginRedirect } from "../../lib/auth/postLoginRedirect";
import { setPasswordPolicy } from "../../lib/config/setPasswordPolicy";

describe("resolvePostLoginRedirect", () => {
  it("routes to set-password for passwordless user when prompt policy is enabled", () => {
    const target = resolvePostLoginRedirect({
      returnTo: "/app",
      hasPassword: false,
      skipUntilMs: null
    });

    expect(target).toBe("/account/set-password?returnTo=%2Fapp");
  });

  it("returns intended route for users with password", () => {
    const target = resolvePostLoginRedirect({
      returnTo: "/app/storybooks/1",
      hasPassword: true
    });

    expect(target).toBe("/app/storybooks/1");
  });

  it("respects active skip window", () => {
    const nowMs = Date.UTC(2026, 2, 5, 12, 0, 0);
    const target = resolvePostLoginRedirect({
      returnTo: "/app",
      hasPassword: false,
      nowMs,
      skipUntilMs: nowMs + 60_000
    });

    expect(target).toBe("/app");
  });

  it("avoids loop when returnTo is set-password route", () => {
    const target = resolvePostLoginRedirect({
      returnTo: "/account/set-password",
      hasPassword: false,
      policy: setPasswordPolicy
    });

    expect(target).toBe("/account/set-password");
  });
});

