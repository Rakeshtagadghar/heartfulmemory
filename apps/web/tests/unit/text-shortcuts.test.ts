import {
  isNodeCopyShortcut,
  isNodeDuplicateShortcut,
  isNodePasteShortcut
} from "../../../../packages/editor/shortcuts/shortcuts";

function makeKeyboardEvent(key: string, modifiers?: { ctrl?: boolean; meta?: boolean; shift?: boolean }) {
  return {
    key,
    ctrlKey: Boolean(modifiers?.ctrl),
    metaKey: Boolean(modifiers?.meta),
    shiftKey: Boolean(modifiers?.shift)
  } as KeyboardEvent;
}

describe("text node shortcuts", () => {
  it("detects copy/paste shortcuts with ctrl or meta", () => {
    expect(isNodeCopyShortcut(makeKeyboardEvent("c", { ctrl: true }))).toBe(true);
    expect(isNodeCopyShortcut(makeKeyboardEvent("C", { meta: true }))).toBe(true);
    expect(isNodePasteShortcut(makeKeyboardEvent("v", { ctrl: true }))).toBe(true);
    expect(isNodePasteShortcut(makeKeyboardEvent("v"))).toBe(false);
  });

  it("detects duplicate shortcut", () => {
    expect(isNodeDuplicateShortcut(makeKeyboardEvent("d", { ctrl: true }))).toBe(true);
    expect(isNodeDuplicateShortcut(makeKeyboardEvent("d", { meta: true }))).toBe(true);
    expect(isNodeDuplicateShortcut(makeKeyboardEvent("d", { shift: true }))).toBe(false);
  });
});
