import { describe, expect, it } from "vitest";
import { formatResendFromAddress } from "../../lib/email/sender";

describe("sender from-address formatting", () => {
  it("adds default Memorioso display name for plain email", () => {
    expect(formatResendFromAddress("hello@memorioso.co.uk")).toBe("Memorioso <hello@memorioso.co.uk>");
  });

  it("uses configured display name when provided", () => {
    expect(formatResendFromAddress("hello@memorioso.co.uk", "Memorioso Support")).toBe(
      "Memorioso Support <hello@memorioso.co.uk>"
    );
  });

  it("preserves preformatted from address", () => {
    expect(formatResendFromAddress("Team Memorioso <hello@memorioso.co.uk>")).toBe(
      "Team Memorioso <hello@memorioso.co.uk>"
    );
  });
});
