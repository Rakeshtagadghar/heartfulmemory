import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestimonialSlider } from "../../components/marketing/blocks/testimonial-slider";
import type { TestimonialsBlock } from "../../content/landing.schema";

const block: TestimonialsBlock = {
  type: "testimonials",
  id: "testimonials",
  content: {
    title: "What families say",
    items: [
      { quote: "First quote", name: "Ava", role: "Daughter" },
      { quote: "Second quote", name: "Leo", role: "Grandson" }
    ]
  }
};

describe("TestimonialSlider", () => {
  it("supports keyboard and button navigation", async () => {
    const user = userEvent.setup();

    render(<TestimonialSlider block={block} />);

    const region = screen.getByRole("region", { name: /what families say/i });
    expect(screen.getByText(/first quote/i)).toBeInTheDocument();

    region.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText(/second quote/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous testimonial/i }));
    expect(screen.getByText(/first quote/i)).toBeInTheDocument();
  });
});
