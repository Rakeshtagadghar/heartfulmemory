import { describe, expect, it } from "vitest";
import { createClientRequestId } from "../../lib/createFlow/clientRequestId";

describe("createClientRequestId", () => {
  it("uses the provided prefix", () => {
    const value = createClientRequestId("wizard");
    expect(value.startsWith("wizard_")).toBe(true);
  });

  it("returns unique values across calls", () => {
    const a = createClientRequestId("test");
    const b = createClientRequestId("test");
    expect(a).not.toBe(b);
  });
});

