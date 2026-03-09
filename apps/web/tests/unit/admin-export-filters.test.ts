import { describe, expect, it } from "vitest";
import { normalizeAdminExportsSearchParams } from "../../lib/admin/exportFilters";

describe("normalizeAdminExportsSearchParams", () => {
  it("treats blank form values as undefined filters", () => {
    expect(
      normalizeAdminExportsSearchParams({
        q: "",
        status: "",
        failureCategory: "",
        retryEligible: "",
        page: "",
      })
    ).toEqual({
      q: undefined,
      status: undefined,
      failureCategory: undefined,
      retryEligible: undefined,
      page: 1,
    });
  });

  it("parses valid filter values", () => {
    expect(
      normalizeAdminExportsSearchParams({
        q: " job_123 ",
        status: "failed",
        failureCategory: "timeout",
        retryEligible: "true",
        page: "3",
      })
    ).toEqual({
      q: "job_123",
      status: "failed",
      failureCategory: "timeout",
      retryEligible: true,
      page: 3,
    });
  });
});
