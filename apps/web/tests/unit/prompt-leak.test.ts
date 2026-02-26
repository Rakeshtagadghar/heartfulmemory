import { describe, expect, it } from "vitest";
import { detectPromptLeakage, startsWithLiteralSectionLabel } from "../../../../lib/ai/validators/promptLeak";

describe("promptLeak validator", () => {
  it("detects leaked instruction phrases like 'Write as...'", () => {
    const hits = detectPromptLeakage(
      "Write as the storyteller speaking about their own life. Return only valid JSON."
    );
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags literal section label prefixes", () => {
    expect(startsWithLiteralSectionLabel("Opening. The family lived by the river.")).toBe(true);
    expect(startsWithLiteralSectionLabel("The memory begins by the river at dawn.")).toBe(false);
  });
});

