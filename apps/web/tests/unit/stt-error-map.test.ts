import { describe, expect, it } from "vitest";
import { mapSttError } from "../../../../lib/stt/errorMap";

describe("mapSttError", () => {
  it("maps provider rate limit errors", () => {
    const mapped = mapSttError(new Error("Provider rate limit: 429"));
    expect(mapped.code).toBe("PROVIDER_RATE_LIMIT");
    expect(mapped.retryable).toBe(true);
  });

  it("maps unsupported mime errors", () => {
    const mapped = mapSttError(new Error("Unsupported mime type: audio/x-test"));
    expect(mapped.code).toBe("UNSUPPORTED_MIME");
    expect(mapped.retryable).toBe(false);
  });
});

