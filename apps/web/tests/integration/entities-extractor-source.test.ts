import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("entities extractor source contract", () => {
  it("defines extractFromAnswers action with citations and postprocess step", () => {
    const source = readFileSync(join(process.cwd(), "../../convex/ai/entitiesExtractor.ts"), "utf8");
    expect(source).toContain("export const extractFromAnswers = action");
    expect(source).toContain("citations");
    expect(source).toContain("postprocessEntitiesV2");
    expect(source).toContain('generator: "llm_extractor_v2"');
  });
});
