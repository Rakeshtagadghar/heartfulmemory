import { track } from "../../components/analytics";

describe("track", () => {
  it("dispatches an analytics:event CustomEvent with payload", () => {
    const handler = vi.fn();
    globalThis.addEventListener("analytics:event", handler as EventListener);

    track("cta_start_click", { section: "hero" });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{
      event: string;
      props: Record<string, unknown>;
    }>;
    expect(event.detail.event).toBe("cta_start_click");
    expect(event.detail.props).toMatchObject({ section: "hero" });

    globalThis.removeEventListener("analytics:event", handler as EventListener);
  });
});
