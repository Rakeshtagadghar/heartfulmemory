import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PagesToggle } from "../../components/studio/PagesToggle";
import { SinglePageView } from "../../../../packages/editor/pages/SinglePageView";
import { ContinuousPagesView } from "../../../../packages/editor/pages/ContinuousPagesView";
import type { PageViewMode } from "../../../../packages/editor/pages/viewMode";

function Harness() {
  const [mode, setMode] = useState<PageViewMode>("single_page");

  return (
    <div>
      <PagesToggle
        mode={mode}
        onToggle={() => setMode((current) => (current === "single_page" ? "continuous" : "single_page"))}
      />
      {mode === "single_page" ? (
        <SinglePageView pageCount={2} onPreviousPage={() => undefined} onNextPage={() => undefined}>
          <div data-testid="single-page-view">single</div>
        </SinglePageView>
      ) : (
        <ContinuousPagesView>
          <div data-testid="continuous-pages-view">continuous</div>
        </ContinuousPagesView>
      )}
    </div>
  );
}

describe("pages mode toggle", () => {
  it("switches between SinglePageView and ContinuousPagesView", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByTestId("single-page-view")).toBeInTheDocument();
    expect(screen.queryByTestId("continuous-pages-view")).toBeNull();

    await user.click(screen.getByRole("button", { name: /pages/i }));

    expect(screen.queryByTestId("single-page-view")).toBeNull();
    expect(screen.getByTestId("continuous-pages-view")).toBeInTheDocument();
  });
});
