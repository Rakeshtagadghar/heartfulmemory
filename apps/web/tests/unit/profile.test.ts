import { onboardingInputSchema } from "../../lib/profile";

describe("onboardingInputSchema", () => {
  it("accepts valid onboarding payload", () => {
    const parsed = onboardingInputSchema.safeParse({
      displayName: "Rakesh",
      goal: "create_storybook",
      marketingConsent: true
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects missing display name", () => {
    const parsed = onboardingInputSchema.safeParse({
      displayName: "",
      goal: "create_storybook",
      marketingConsent: false
    });

    expect(parsed.success).toBe(false);
  });
});
