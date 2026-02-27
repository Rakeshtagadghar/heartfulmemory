import { describe, expect, it } from "vitest";
import { redactUnknown, sanitizeUrlQuery } from "../../../../lib/observability/redact";

describe("redact", () => {
  it("redacts nested sensitive keys", () => {
    const value = redactUnknown({
      promptText: "private prompt",
      nested: {
        transcriptText: "private transcript",
        safe: "ok"
      }
    }) as Record<string, unknown>;

    expect(value.promptText).toBe("[REDACTED]");
    expect((value.nested as Record<string, unknown>).transcriptText).toBe("[REDACTED]");
    expect((value.nested as Record<string, unknown>).safe).toBe("ok");
  });

  it("masks non-whitelisted query params", () => {
    const sanitized = sanitizeUrlQuery("/studio/abc?chapter=ch1&page=p2&token=secret");
    expect(sanitized).toContain("chapter=ch1");
    expect(sanitized).toContain("page=p2");
    expect(sanitized).toContain("token=%5BREDACTED%5D");
  });
});
