import { isValidEmail, normalizeEmail } from "../../lib/validation/email";

describe("email validation", () => {
  it("normalizes email casing and whitespace", () => {
    expect(normalizeEmail("  USER@Example.COM  ")).toBe("user@example.com");
  });

  it("validates common email formats", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("bad-email")).toBe(false);
    expect(isValidEmail("user@localhost")).toBe(false);
  });
});

