import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ElementsPanel } from "../../components/studio/panels/ElementsPanel";

describe("ElementsPanel", () => {
  it("inserts a quick chip element", async () => {
    const user = userEvent.setup();
    const onInsertElement = vi.fn();
    const onOpenPhotos = vi.fn();

    render(<ElementsPanel onInsertElement={onInsertElement} onOpenPhotos={onOpenPhotos} />);

    await user.click(screen.getByRole("button", { name: "Rectangle" }));

    expect(onInsertElement).toHaveBeenCalledWith("rect");
  });

  it("opens a category detail view and inserts an item from it", async () => {
    const user = userEvent.setup();
    const onInsertElement = vi.fn();

    render(<ElementsPanel onInsertElement={onInsertElement} onOpenPhotos={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Shapes/i }));
    const circleButtons = screen.getAllByRole("button", { name: /Circle/i });
    const circleCatalogButton = circleButtons.at(-1);
    expect(circleCatalogButton).toBeDefined();
    if (!circleCatalogButton) {
      throw new Error("Circle catalog button not found");
    }
    await user.click(circleCatalogButton);

    expect(onInsertElement).toHaveBeenCalledWith("circle");
  });
});
