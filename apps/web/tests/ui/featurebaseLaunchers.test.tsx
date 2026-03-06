import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useSelectedLayoutSegments: () => []
}));

function mountVisibleFeaturebaseIframe() {
  const iframe = document.createElement("iframe");
  iframe.src = "https://do.featurebase.app/widget";
  iframe.style.display = "block";
  iframe.style.visibility = "visible";
  iframe.getBoundingClientRect = () =>
    ({
      width: 320,
      height: 480,
      top: 0,
      left: 0,
      right: 320,
      bottom: 480,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      }
    }) as DOMRect;
  document.body.appendChild(iframe);
  return iframe;
}

describe("FeaturebaseProvider", () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    window.localStorage.clear();

    const { __featurebaseLoaderTestUtils } = await import("../../lib/featurebase/loader");
    __featurebaseLoaderTestUtils.reset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("does not inject the SDK when Featurebase is disabled", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "false";

    const { FeaturebaseProvider } = await import("../../components/featurebase/FeaturebaseProvider");
    const { getFeaturebaseScriptId } = await import("../../lib/featurebase/loader");

    render(<FeaturebaseProvider />);

    await waitFor(() => {
      expect(document.getElementById(getFeaturebaseScriptId())).toBeNull();
    });
  });

  it("injects the SDK in the authenticated app shell when free-tier-safe config is enabled", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "true";
    process.env.NEXT_PUBLIC_FEATUREBASE_ORGANIZATION = "memorioso";
    process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID = "app_test_123";

    const { FeaturebaseProvider } = await import("../../components/featurebase/FeaturebaseProvider");
    const { getFeaturebaseScriptId } = await import("../../lib/featurebase/loader");

    render(<FeaturebaseProvider />);

    await waitFor(() => {
      expect(document.getElementById(getFeaturebaseScriptId())).not.toBeNull();
    });
  });

  it("renders launchers only when Featurebase is enabled", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "true";
    process.env.NEXT_PUBLIC_FEATUREBASE_ORGANIZATION = "memorioso";

    const { FeedbackLauncher } = await import("../../components/featurebase/FeedbackLauncher");
    const { ChangelogLauncher } = await import("../../components/featurebase/ChangelogLauncher");

    render(
      <>
        <FeedbackLauncher context="dashboard" />
        <ChangelogLauncher context="dashboard" />
      </>
    );

    expect(screen.getByRole("button", { name: "Send feedback" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "What's new" })).toBeInTheDocument();
  });

  it("shows the changelog unread badge from stored state", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "true";
    process.env.NEXT_PUBLIC_FEATUREBASE_ORGANIZATION = "memorioso";
    window.localStorage.setItem("featurebase.changelog.unread_count", "3");

    const { ChangelogLauncher } = await import("../../components/featurebase/ChangelogLauncher");

    render(<ChangelogLauncher context="dashboard" />);

    expect(screen.getByLabelText("3 unread updates")).toBeInTheDocument();
  });

  it("renders the messenger launcher when Featurebase messenger is configured", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "true";
    process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID = "app_test_123";

    const { MessengerWidget } = await import("../../components/featurebase/MessengerWidget");

    render(<MessengerWidget context="app_shell" />);

    expect(screen.getByRole("button", { name: "Open help messenger" })).toBeInTheDocument();
  });

  it("opens the feedback widget through the documented postMessage flow", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "true";
    process.env.NEXT_PUBLIC_FEATUREBASE_ORGANIZATION = "memorioso";

    const postMessageSpy = vi.spyOn(window, "postMessage");
    const { FeedbackLauncher } = await import("../../components/featurebase/FeedbackLauncher");
    const { getFeaturebaseScriptId } = await import("../../lib/featurebase/loader");

    render(<FeedbackLauncher context="dashboard" />);

    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    const script = document.getElementById(getFeaturebaseScriptId()) as HTMLScriptElement | null;
    script?.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          target: "FeaturebaseWidget"
        }),
        window.location.origin
      );
    });
  });

  it("queues messenger boot and show commands when the launcher is opened", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "true";
    process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID = "app_test_123";

    const { MessengerWidget } = await import("../../components/featurebase/MessengerWidget");
    const { getFeaturebaseScriptId } = await import("../../lib/featurebase/loader");
    mountVisibleFeaturebaseIframe();

    render(<MessengerWidget context="app_shell" />);

    fireEvent.click(screen.getByRole("button", { name: "Open help messenger" }));

    const script = document.getElementById(getFeaturebaseScriptId()) as HTMLScriptElement | null;
    script?.dispatchEvent(new Event("load"));

    await waitFor(() => {
      const queue = (window.Featurebase as { q?: Array<[string]> } | undefined)?.q ?? [];
      expect(queue.some((entry) => entry[0] === "boot")).toBe(true);
      expect(queue.some((entry) => entry[0] === "show")).toBe(true);
    });
  });

  it("toggles to a close state and queues hide when clicked again", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "true";
    process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID = "app_test_123";

    const { MessengerWidget } = await import("../../components/featurebase/MessengerWidget");
    const { getFeaturebaseScriptId } = await import("../../lib/featurebase/loader");
    mountVisibleFeaturebaseIframe();

    render(<MessengerWidget context="app_shell" />);

    fireEvent.click(screen.getByRole("button", { name: "Open help messenger" }));

    const script = document.getElementById(getFeaturebaseScriptId()) as HTMLScriptElement | null;
    script?.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Close help messenger" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Close help messenger" }));

    await waitFor(() => {
      const queue = (window.Featurebase as { q?: Array<[string]> } | undefined)?.q ?? [];
      expect(queue.some((entry) => entry[0] === "hide")).toBe(true);
      expect(screen.getByRole("button", { name: "Open help messenger" })).toBeInTheDocument();
    });
  });

  it("syncs back to the open state when Featurebase fires an onHide event", async () => {
    process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED = "true";
    process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID = "app_test_123";

    const { MessengerWidget } = await import("../../components/featurebase/MessengerWidget");
    const { getFeaturebaseScriptId } = await import("../../lib/featurebase/loader");
    mountVisibleFeaturebaseIframe();

    render(<MessengerWidget context="app_shell" />);

    fireEvent.click(screen.getByRole("button", { name: "Open help messenger" }));

    const script = document.getElementById(getFeaturebaseScriptId()) as HTMLScriptElement | null;
    script?.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Close help messenger" })).toBeInTheDocument();
    });

    const queue =
      (window.Featurebase as {
        q?: Array<[string, unknown?, (() => void)?]>;
      } | undefined)?.q ?? [];
    const onHideEntry = queue.find((entry) => entry[0] === "onHide");
    const onHideCallback =
      typeof onHideEntry?.[1] === "function"
        ? (onHideEntry[1] as () => void)
        : typeof onHideEntry?.[2] === "function"
          ? onHideEntry[2]
          : undefined;
    expect(onHideCallback).toBeTypeOf("function");
    await act(async () => {
      onHideCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open help messenger" })).toBeInTheDocument();
    });
  });
});
