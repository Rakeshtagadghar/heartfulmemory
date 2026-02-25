import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { StudioShellV2 } from "../../components/studio/shell/StudioShellV2";
import { useHoverPanelController } from "../../components/studio/shell/useHoverPanelController";

function Harness({ onCanvasClick }: { onCanvasClick: () => void }) {
  const controller = useHoverPanelController();
  const [count, setCount] = useState(0);

  return (
    <div className="relative h-[480px] w-[900px]">
      <StudioShellV2
        rootRef={controller.rootRef}
        hoverCapable={controller.hoverCapable}
        openPanelId={controller.openPanelId}
        pinnedPanelId={controller.pinnedPanelId}
        closePanel={controller.closePanel}
        pinPanel={controller.pinPanel}
        onIconHoverStart={controller.onIconHoverStart}
        onIconHoverEnd={controller.onIconHoverEnd}
        onPanelHoverStart={controller.onPanelHoverStart}
        onPanelHoverEnd={controller.onPanelHoverEnd}
        onIconActivate={controller.onIconActivate}
        panelContents={{
          text: <div>Text Panel Content</div>,
          uploads: <div>Uploads Panel Content</div>
        }}
        onCanvasPointerDownCapture={controller.onCanvasPointerDown}
      >
        <button
          type="button"
          onClick={() => {
            setCount((value) => value + 1);
            onCanvasClick();
          }}
        >
          Canvas Button {count}
        </button>
      </StudioShellV2>
    </div>
  );
}

describe("StudioShellV2", () => {
  it("opens and closes a panel without breaking canvas clicks", () => {
    const onCanvasClick = vi.fn();
    render(<Harness onCanvasClick={onCanvasClick} />);

    fireEvent.click(screen.getByLabelText("Text"));
    expect(screen.getByText("Text Panel Content")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Text Panel Content")).not.toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Canvas Button/i }));
    expect(onCanvasClick).toHaveBeenCalledTimes(1);
  });
});
