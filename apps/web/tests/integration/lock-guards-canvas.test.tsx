import { fireEvent, render, screen } from "@testing-library/react";
import type { FrameDTO } from "../../lib/dto/frame";
import { FrameRenderer } from "../../components/editor2/FrameRenderer";

function buildFrame(overrides: Partial<FrameDTO>): FrameDTO {
  return {
    id: "f1",
    storybook_id: "sb1",
    page_id: "p1",
    owner_id: "u1",
    type: "IMAGE",
    x: 10,
    y: 20,
    w: 240,
    h: 140,
    z_index: 1,
    locked: false,
    style: {},
    content: { sourceUrl: "https://example.com/image.jpg" },
    crop: null,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function renderFrame(frame: FrameDTO, callbacks?: Partial<Parameters<typeof FrameRenderer>[0]>) {
  const onSelect = vi.fn();
  const onStartTextEdit = vi.fn();
  const onStartCropEdit = vi.fn();
  const onDragStart = vi.fn();
  const onResizeStart = vi.fn();

  render(
    <FrameRenderer
      frame={frame}
      selected={true}
      textEditing={false}
      cropEditing={false}
      onSelect={onSelect}
      onStartTextEdit={onStartTextEdit}
      onStartCropEdit={onStartCropEdit}
      onDragStart={onDragStart}
      onResizeStart={onResizeStart}
      {...callbacks}
    />
  );

  return { onSelect, onStartTextEdit, onStartCropEdit, onDragStart, onResizeStart };
}

describe("lock guard interactions in canvas frame renderer", () => {
  it("prevents locked image from drag and crop entry", () => {
    const frame = buildFrame({ type: "IMAGE", locked: true });
    const { onStartCropEdit, onDragStart } = renderFrame(frame);

    const selectButton = screen.getByRole("button", { name: /select image frame/i });
    fireEvent.pointerDown(selectButton);
    fireEvent.doubleClick(selectButton);

    expect(onDragStart).not.toHaveBeenCalled();
    expect(onStartCropEdit).not.toHaveBeenCalled();
  });

  it("prevents locked text frame from entering text edit on click", () => {
    const frame = buildFrame({
      type: "TEXT",
      locked: true,
      content: { text: "Locked text" },
      style: {}
    });
    const { onStartTextEdit } = renderFrame(frame);

    const selectButton = screen.getByRole("button", { name: /select text frame/i });
    fireEvent.click(selectButton);

    expect(onStartTextEdit).not.toHaveBeenCalled();
  });
});
