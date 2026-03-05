import { track } from "../../components/analytics";

describe("track", () => {
  afterEach(() => {
    document.cookie = "analytics_rejected=; Path=/; Max-Age=0";
    document.cookie = "analytics_consent=; Path=/; Max-Age=0";
  });

  it("dispatches an analytics:event CustomEvent with payload", () => {
    const handler = vi.fn();
    globalThis.addEventListener("analytics:event", handler as EventListener);

    track("cta_click", { cta_id: "start_click", placement: "hero", section: "hero" });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{
      event: string;
      props: Record<string, unknown>;
    }>;
    expect(event.detail.event).toBe("cta_click");
    expect(event.detail.props).toMatchObject({ section: "hero" });
    expect(typeof event.detail.props.session_id).toBe("string");

    globalThis.removeEventListener("analytics:event", handler as EventListener);
  });

  it("does not emit analytics when user rejected cookies", () => {
    document.cookie = "analytics_rejected=1; Path=/";
    const handler = vi.fn();
    globalThis.addEventListener("analytics:event", handler as EventListener);

    track("cta_click", { cta_id: "start_click", placement: "hero", section: "hero" });

    expect(handler).not.toHaveBeenCalled();
    globalThis.removeEventListener("analytics:event", handler as EventListener);
  });

  it("redacts pii-like values and free-text fields", () => {
    const handler = vi.fn();
    globalThis.addEventListener("analytics:event", handler as EventListener);

    track("generate_lead", {
      lead_type: "waitlist",
      form_id: "email_capture",
      email: "user@example.com",
      question: "What is your family story?"
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{
      event: string;
      props: Record<string, unknown>;
    }>;
    expect(event.detail.props.form_id).toBe("email_capture");
    expect(event.detail.props.email).toBeUndefined();
    expect(event.detail.props.question).toBeUndefined();
    expect(event.detail.props.email_category).toBe("redacted");
    expect(event.detail.props.question_category).toBe("redacted");
    expect(event.detail.props.redacted_fields_count).toBe(2);

    globalThis.removeEventListener("analytics:event", handler as EventListener);
  });
});
