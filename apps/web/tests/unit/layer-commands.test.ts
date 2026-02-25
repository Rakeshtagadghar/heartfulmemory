import { bringForward, bringToFront, sendBackward, sendToBack } from "../../../../packages/editor/commands/layerCommands";

describe("layerCommands", () => {
  it("preserves relative order in multi-select when sending to front", () => {
    const next = bringToFront(["a", "b", "c", "d", "e"], ["b", "d"]);
    expect(next).toEqual(["a", "c", "e", "b", "d"]);
  });

  it("moves selected set by one step backward/forward", () => {
    expect(bringForward(["a", "b", "c", "d"], ["b", "c"])).toEqual(["a", "d", "b", "c"]);
    expect(sendBackward(["a", "b", "c", "d"], ["c", "d"])).toEqual(["a", "c", "d", "b"]);
  });

  it("sends selected set to back preserving relative order", () => {
    const next = sendToBack(["a", "b", "c", "d", "e"], ["d", "b"]);
    expect(next).toEqual(["b", "d", "a", "c", "e"]);
  });
});
