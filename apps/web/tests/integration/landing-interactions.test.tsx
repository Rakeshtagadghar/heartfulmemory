import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailCaptureForm } from "../../components/email-capture-form";
import { FaqAccordion } from "../../components/faq-accordion";

describe("landing interactions", () => {
  it("submits email capture and fires analytics event", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );
    window.addEventListener("analytics:event", handler as EventListener);

    render(<EmailCaptureForm />);

    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /join the waitlist/i }));

    expect(screen.getByRole("button", { name: /you are in/i })).toBeInTheDocument();
    expect(handler).toHaveBeenCalled();
    const submitEvent = handler.mock.calls.find(
      (args) =>
        (args[0] as CustomEvent<{ event: string }>).detail.event ===
        "generate_lead"
    )?.[0];
    expect(submitEvent).toBeDefined();

    window.removeEventListener("analytics:event", handler as EventListener);
    fetchMock.mockRestore();
  });

  it("expands faq item with accessible aria attrs and tracks expand", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener("analytics:event", handler as EventListener);

    render(
      <FaqAccordion
        items={[
          { q: "Question A", a: "Answer A" },
          { q: "Question B", a: "Answer B" }
        ]}
      />
    );

    const buttonA = screen.getByRole("button", { name: "Question A" });
    const buttonB = screen.getByRole("button", { name: "Question B" });

    expect(buttonA).toHaveAttribute("aria-expanded", "true");
    expect(buttonB).toHaveAttribute("aria-expanded", "false");

    await user.click(buttonB);

    expect(buttonB).toHaveAttribute("aria-expanded", "true");
    expect(buttonA).toHaveAttribute("aria-expanded", "false");
    expect(handler).toHaveBeenCalled();
    const faqEvent = handler.mock.calls.find(
      (args) =>
        (
          args[0] as CustomEvent<{
            event: string;
            props: { cta_id: string; placement: string; variant_id: string };
          }>
        ).detail.event === "cta_click"
    )?.[0];
    expect(faqEvent?.detail.props.cta_id).toBe("faq_expand");
    expect(faqEvent?.detail.props.placement).toBe("landing_faq");
    expect(faqEvent?.detail.props.variant_id).toBe("faq_q_2");

    window.removeEventListener("analytics:event", handler as EventListener);
  });
});
