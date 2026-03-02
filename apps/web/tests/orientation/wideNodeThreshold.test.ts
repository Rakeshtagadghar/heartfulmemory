import { describe, expect, it } from "vitest";
import { classifyNode } from "../../../../packages/shared/orientation/reflowMath";
import { WIDE_NODE_THRESHOLD } from "../../../../packages/shared/orientation/reflowTypes";

describe("Wide node threshold classification", () => {
  const safeW = 728; // typical safe width for BOOK_8_5X11 portrait (816 - 44*2)

  it("classifies node at exactly 60% as wide", () => {
    const nodeW = safeW * WIDE_NODE_THRESHOLD; // 60%
    expect(classifyNode(nodeW, safeW)).toBe("wide");
  });

  it("classifies node at 59% as fixed", () => {
    const nodeW = safeW * 0.59;
    expect(classifyNode(nodeW, safeW)).toBe("fixed");
  });

  it("classifies node at 100% as wide", () => {
    expect(classifyNode(safeW, safeW)).toBe("wide");
  });

  it("classifies node at 80% as wide", () => {
    const nodeW = safeW * 0.8;
    expect(classifyNode(nodeW, safeW)).toBe("wide");
  });

  it("classifies node at 30% as fixed", () => {
    const nodeW = safeW * 0.3;
    expect(classifyNode(nodeW, safeW)).toBe("fixed");
  });

  it("classifies zero-width node as fixed", () => {
    expect(classifyNode(0, safeW)).toBe("fixed");
  });

  it("classifies node as fixed when safe width is zero", () => {
    expect(classifyNode(100, 0)).toBe("fixed");
  });

  it("threshold constant is 0.60", () => {
    expect(WIDE_NODE_THRESHOLD).toBe(0.60);
  });
});
