import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlphaBanner } from "../../components/alpha/AlphaBanner";

describe("alpha banner dismissal", () => {
  beforeEach(() => {
    window.localStorage.removeItem("memorioso.alpha_banner_dismissed_at");
  });

  it("renders when not dismissed", async () => {
    render(<AlphaBanner onLearnMore={() => undefined} />);
    await waitFor(() => {
      expect(screen.getByText(/Early Alpha/i)).toBeInTheDocument();
    });
  });

  it("persists dismissal in localStorage", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AlphaBanner onLearnMore={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();

    unmount();
    render(<AlphaBanner onLearnMore={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });
});
