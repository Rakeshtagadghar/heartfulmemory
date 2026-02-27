import { describe, expect, it } from "vitest";
import { redactUnknown, sanitizeUrlQuery } from "../../../../lib/observability/redact";

describe("observability redact helpers", () => {
  it("redacts nested sensitive keys", () => {
    const redacted = redactUnknown({
      flow: "draft_generate_v2",
      prompt: "raw chapter prompt text",
      nested: {
        transcriptText: "private transcript",
        safe: "ok"
      }
    }) as Record<string, unknown>;

    expect(redacted.prompt).toBe("[REDACTED]");
    expect((redacted.nested as Record<string, unknown>).transcriptText).toBe("[REDACTED]");
    expect((redacted.nested as Record<string, unknown>).safe).toBe("ok");
  });

  it("keeps only allowed query values", () => {
    const value = sanitizeUrlQuery("/studio/abc?chapter=ch1&page=p2&token=secret&email=user@example.com");
    expect(value).toContain("chapter=ch1");
    expect(value).toContain("page=p2");
    expect(value).toContain("token=%5BREDACTED%5D");
    expect(value).toContain("email=%5BREDACTED%5D");
  });
});
