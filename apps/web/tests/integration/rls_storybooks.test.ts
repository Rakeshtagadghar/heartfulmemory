import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "..", "..");

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Sprint 4 Convex authz usage", () => {
  it("core Convex modules reference authz helpers", () => {
    const checks: Array<[string, string[]]> = [
      ["convex/storybooks.ts", ["requireUser", "assertCanAccessStorybook"]],
      ["convex/chapters.ts", ["assertCanAccessStorybook"]],
      ["convex/blocks.ts", ["assertCanAccessStorybook"]],
      ["convex/assets.ts", ["requireUser"]],
      ["convex/templates.ts", ["requireUser"]]
    ];

    for (const [file, markers] of checks) {
      const source = readRepoFile(file);
      for (const marker of markers) {
        expect(source, `${file} should include ${marker}`).toContain(marker);
      }
    }
  });
});
