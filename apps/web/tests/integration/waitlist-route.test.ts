import path from "node:path";
import os from "node:os";
import { rm, readFile } from "node:fs/promises";
import { POST, __waitlistTestUtils } from "../../app/api/waitlist/route";

describe("waitlist route", () => {
  const tempFile = path.join(os.tmpdir(), `memorioso-waitlist-${Date.now()}.jsonl`);

  beforeEach(async () => {
    process.env.WAITLIST_STORAGE_FILE = tempFile;
    process.env.WAITLIST_RATE_LIMIT_WINDOW_MS = "60000";
    process.env.WAITLIST_RATE_LIMIT_MAX = "1";
    __waitlistTestUtils.resetRateLimitStore();
    await rm(tempFile, { force: true });
  });

  afterAll(async () => {
    await rm(tempFile, { force: true });
    delete process.env.WAITLIST_STORAGE_FILE;
    delete process.env.WAITLIST_RATE_LIMIT_WINDOW_MS;
    delete process.env.WAITLIST_RATE_LIMIT_MAX;
  });

  it("accepts a valid submission and stores it", async () => {
    const request = new Request("http://localhost:3000/api/waitlist", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.1"
      },
      body: JSON.stringify({
        email: "User@example.com",
        utm_source: "test"
      })
    });

    const response = await POST(request);
    const body = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);

    const stored = await readFile(tempFile, "utf8");
    expect(stored).toContain("\"email\":\"user@example.com\"");
    expect(stored).toContain("\"utm_source\":\"test\"");
  });

  it("rejects honeypot submissions", async () => {
    const request = new Request("http://localhost:3000/api/waitlist", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.2"
      },
      body: JSON.stringify({
        email: "user@example.com",
        website: "spam.example"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rate limits repeated submissions from the same IP", async () => {
    const makeRequest = () =>
      POST(
        new Request("http://localhost:3000/api/waitlist", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.3"
          },
          body: JSON.stringify({ email: "user@example.com" })
        })
      );

    const first = await makeRequest();
    const second = await makeRequest();

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });
});

