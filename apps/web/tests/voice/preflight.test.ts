import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkVoicePreflight } from "../../lib/voice/preflight";

type MockPermissionState = {
  state: PermissionState;
};

describe("checkVoicePreflight", () => {
  const originalMediaDevices = navigator.mediaDevices;
  const originalPermissions = navigator.permissions;
  const originalLocation = window.location;
  const secureDescriptor = Object.getOwnPropertyDescriptor(window, "isSecureContext");

  beforeEach(() => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.com") as unknown as Location
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: originalMediaDevices
    });
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: originalPermissions
    });
    if (secureDescriptor) {
      Object.defineProperty(window, "isSecureContext", secureDescriptor);
    }
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation
    });
  });

  it("returns unsupported when getUserMedia is unavailable", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {}
    });

    const result = await checkVoicePreflight();
    expect(result.ready).toBe(false);
    expect(result.code).toBe("MIC_UNSUPPORTED_BROWSER");
  });

  it("returns insecure context when recording is not on a secure page", async () => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://example.com") as unknown as Location
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn(async () => [])
      }
    });

    const result = await checkVoicePreflight();
    expect(result.ready).toBe(false);
    expect(result.code).toBe("MIC_INSECURE_CONTEXT");
  });

  it("returns permission denied when the Permissions API says microphone is blocked", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn(async () => [{ kind: "audioinput" }])
      }
    });
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        query: vi.fn(async () => ({ state: "denied" } satisfies MockPermissionState))
      }
    });

    const result = await checkVoicePreflight();
    expect(result.ready).toBe(false);
    expect(result.code).toBe("MIC_PERMISSION_DENIED");
  });

  it("returns no microphone when no audio inputs are available", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn(async () => [{ kind: "videoinput" }])
      }
    });
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        query: vi.fn(async () => ({ state: "prompt" } satisfies MockPermissionState))
      }
    });

    const result = await checkVoicePreflight();
    expect(result.ready).toBe(false);
    expect(result.code).toBe("MIC_NOT_FOUND");
  });
});
