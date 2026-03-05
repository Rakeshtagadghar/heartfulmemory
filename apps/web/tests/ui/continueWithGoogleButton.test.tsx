import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContinueWithGoogleButton } from "../../components/auth/ContinueWithGoogleButton";

describe("ContinueWithGoogleButton", () => {
  it("renders compliant label", () => {
    render(<ContinueWithGoogleButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
  });

  it("invokes click handler", () => {
    const onClick = vi.fn();
    render(<ContinueWithGoogleButton onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

